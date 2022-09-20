#![cfg(test)]

use crate::testutils::{register_test_contract as register_crowdfund, Crowdfund};
use ed25519_dalek::Keypair;
use rand::{thread_rng, RngCore};
use soroban_auth::Identifier;
use soroban_sdk::{testutils::LedgerInfo, BigInt, BytesN, Env};
use soroban_token_contract::testutils::{
    register_test_contract as register_token, to_ed25519, Token,
};

fn generate_contract_id() -> [u8; 32] {
    let mut id: [u8; 32] = Default::default();
    thread_rng().fill_bytes(&mut id);
    id
}

fn generate_keypair() -> Keypair {
    Keypair::generate(&mut thread_rng())
}

fn create_token_contract(e: &Env, admin: &Keypair) -> (BytesN<32>, Token) {
    let id = generate_contract_id();
    register_token(&e, &id);
    let token = Token::new(e, &id);
    // decimals, name, symbol don't matter in tests
    token.initialize(&to_ed25519(&e, admin), 7, "name", "symbol");
    (BytesN::from_array(&e, &id), token)
}

fn create_crowdfund_contract(
    e: &Env,
    owner: &Keypair,
    deadline: &u64,
    target_amount: &BigInt,
    token: &BytesN<32>,
) -> (BytesN<32>, Crowdfund) {
    let id = generate_contract_id();
    register_crowdfund(&e, &id);
    let crowdfund = Crowdfund::new(e, &id);
    crowdfund
        .client()
        .initialize(&to_ed25519(&e, owner), &deadline, &target_amount, &token);
    (BytesN::from_array(&e, &id), crowdfund)
}

fn advance_ledger(e: &Env, delta: u64) {
    e.set_ledger(LedgerInfo {
        protocol_version: e.ledger().protocol_version(),
        sequence_number: e.ledger().sequence(),
        timestamp: e.ledger().timestamp() + delta,
        base_reserve: 1, // TODO: can't get current base reserve... does this matter for tests?
        network_passphrase: Default::default(), //TODO: Figure out how to go from Bytes to Vec so we can use ledger.network_passphrase?
    });
}

struct Setup {
    env: Env,
    user2: Keypair,
    owner_id: Identifier,
    user1_id: Identifier,
    user2_id: Identifier,
    token: Token,
    crowdfund: Crowdfund,
    crowdfund_id: Identifier,
}

/// Sets up a crowdfund with -
/// 1. Deadline 10 seconds from now.
/// 2. Target amount of 15.
/// 3. One deposit of 10 from user1.
///
impl Setup {
    fn new() -> Self {
        let e: Env = Default::default();
        let owner = generate_keypair();
        let owner_id = to_ed25519(&e, &owner);
        let user1 = generate_keypair();
        let user1_id = to_ed25519(&e, &user1);
        let user2 = generate_keypair();
        let user2_id = to_ed25519(&e, &user2);

        // the deadline is 10 seconds from now
        let deadline = e.ledger().timestamp() + 10;
        let target_amount = BigInt::from_i32(&e, 15);

        let token_admin = generate_keypair();
        let (contract_token, token) = create_token_contract(&e, &token_admin);

        let (contract_crowdfund, crowdfund) =
            create_crowdfund_contract(&e, &owner, &deadline, &target_amount, &contract_token);
        let crowdfund_id = Identifier::Contract(contract_crowdfund);

        token.mint(&token_admin, &user1_id, &BigInt::from_u32(&e, 10));
        token.mint(&token_admin, &user2_id, &BigInt::from_u32(&e, 5));

        token.approve(&user1, &crowdfund_id, &BigInt::from_u32(&e, 10));
        crowdfund
            .client()
            .deposit(&user1_id, &BigInt::from_u32(&e, 10));

        Self {
            env: e,
            owner_id: owner_id,
            user1_id: user1_id,
            user2: user2,
            user2_id: user2_id,
            token: token,
            crowdfund: crowdfund,
            crowdfund_id: crowdfund_id,
        }
    }
}

#[test]
fn test_expired() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 11);

    setup.crowdfund.client().withdraw(&setup.user1_id);

    assert_eq!(
        setup.token.balance(&setup.user1_id),
        BigInt::from_u32(&setup.env, 10)
    );
    assert_eq!(
        setup.token.balance(&setup.crowdfund_id),
        BigInt::zero(&setup.env)
    );
}

#[test]
fn test_success() {
    let setup = Setup::new();
    setup.token.approve(
        &setup.user2,
        &setup.crowdfund_id,
        &BigInt::from_u32(&setup.env, 5),
    );
    setup
        .crowdfund
        .client()
        .deposit(&setup.user2_id, &BigInt::from_u32(&setup.env, 5));

    assert_eq!(
        setup.token.balance(&setup.user1_id),
        BigInt::zero(&setup.env)
    );
    assert_eq!(
        setup.token.balance(&setup.user2_id),
        BigInt::zero(&setup.env)
    );
    assert_eq!(
        setup.token.balance(&setup.crowdfund_id),
        BigInt::from_u32(&setup.env, 15)
    );

    advance_ledger(&setup.env, 10);
    setup.crowdfund.client().withdraw(&setup.owner_id);

    assert_eq!(
        setup.token.balance(&setup.user1_id),
        BigInt::zero(&setup.env)
    );
    assert_eq!(
        setup.token.balance(&setup.user2_id),
        BigInt::zero(&setup.env)
    );
    assert_eq!(
        setup.token.balance(&setup.crowdfund_id),
        BigInt::zero(&setup.env)
    );
    assert_eq!(
        setup.token.balance(&setup.owner_id),
        BigInt::from_u32(&setup.env, 15)
    );
}

#[test]
#[should_panic(expected = "sale is still running")]
fn sale_still_running() {
    let setup = Setup::new();
    setup.crowdfund.client().withdraw(&setup.owner_id);
}

#[test]
#[should_panic(expected = "sale was successful, only the owner may withdraw")]
fn sale_successful_only_owner() {
    let setup = Setup::new();
    setup.token.approve(
        &setup.user2,
        &setup.crowdfund_id,
        &BigInt::from_u32(&setup.env, 5),
    );
    setup
        .crowdfund
        .client()
        .deposit(&setup.user2_id, &BigInt::from_u32(&setup.env, 5));
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.user1_id);
}

#[test]
#[should_panic(expected = "sale expired, the owner may not withdraw")]
fn sale_expired_owner_not_allowed() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.owner_id);
}

#[test]
#[should_panic(expected = "sale is not running")]
fn sale_not_running() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup
        .crowdfund
        .client()
        .deposit(&setup.user1_id, &BigInt::from_u32(&setup.env, 1));
}
