#![cfg(test)]

use super::testutils::{register_test_contract as register_crowdfund, Crowdfund};
use super::token::Client as Token;
use rand::{thread_rng, RngCore};
use soroban_auth::{Identifier, Signature};
use soroban_sdk::{
    testutils::{Accounts, Ledger},
    xdr, AccountId, BytesN, Env,
};

fn generate_contract_id() -> [u8; 32] {
    let mut id: [u8; 32] = Default::default();
    thread_rng().fill_bytes(&mut id);
    id
}

fn create_token_contract(e: &Env, admin: &AccountId) -> (BytesN<32>, Token) {
    let asset = xdr::Asset::CreditAlphanum4(xdr::AlphaNum4 {
        asset_code: xdr::AssetCode4([0x41; 4]),
        issuer: admin.try_into().unwrap(),
    });
    let id = e.register_stellar_asset_contract(asset);
    let id_copy: BytesN<32> = id.clone(); // can't do this inline???

    (id, Token::new(e, id_copy))
}

fn create_crowdfund_contract(
    e: &Env,
    recipient: &AccountId,
    deadline: u64,
    target_amount: &i128,
    token: &BytesN<32>,
) -> (BytesN<32>, Crowdfund) {
    let id = generate_contract_id();
    register_crowdfund(e, &id);
    let crowdfund = Crowdfund::new(e, &id);
    crowdfund.client().initialize(
        &Identifier::Account(recipient.clone()),
        &deadline,
        target_amount,
        token,
    );
    (BytesN::from_array(e, &id), crowdfund)
}

fn advance_ledger(e: &Env, delta: u64) {
    e.ledger().with_mut(|l| {
        l.timestamp += delta;
    });
}

struct Setup {
    env: Env,
    user2: AccountId,
    recipient_id: Identifier,
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
        let e: Env = soroban_sdk::Env::default();
        let recipient = e.accounts().generate_and_create();
        let recipient_id = Identifier::Account(recipient.clone());
        let user1 = e.accounts().generate_and_create();
        let user1_id = Identifier::Account(user1.clone());
        let user2 = e.accounts().generate_and_create();
        let user2_id = Identifier::Account(user2.clone());

        // the deadline is 10 seconds from now
        let deadline = e.ledger().timestamp() + 10;
        let target_amount: i128 = 15;

        let token_admin = e.accounts().generate_and_create();
        let (contract_token, token) = create_token_contract(&e, &token_admin);

        let (contract_crowdfund, crowdfund) =
            create_crowdfund_contract(&e, &recipient, deadline, &target_amount, &contract_token);
        let crowdfund_id = Identifier::Contract(contract_crowdfund);

        token
            .with_source_account(&token_admin)
            .mint(&Signature::Invoker, &0, &user1_id, &10);
        token
            .with_source_account(&token_admin)
            .mint(&Signature::Invoker, &0, &user2_id, &5);

        token
            .with_source_account(&user1)
            .incr_allow(&Signature::Invoker, &0, &crowdfund_id, &10);
        crowdfund.client().deposit(&user1_id, &10);

        Self {
            env: e,
            recipient_id,
            user1_id,
            user2,
            user2_id,
            token,
            crowdfund,
            crowdfund_id,
        }
    }
}

#[test]
fn test_expired() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 11);

    setup.crowdfund.client().withdraw(&setup.user1_id);

    assert_eq!(setup.token.balance(&setup.user1_id), 10);
    assert_eq!(setup.token.balance(&setup.crowdfund_id), 0);
}

#[test]
fn test_success() {
    let setup = Setup::new();
    setup.token.with_source_account(&setup.user2).incr_allow(
        &Signature::Invoker,
        &0,
        &setup.crowdfund_id,
        &5,
    );
    setup.crowdfund.client().deposit(&setup.user2_id, &5);

    assert_eq!(setup.token.balance(&setup.user1_id), 0);
    assert_eq!(setup.token.balance(&setup.user2_id), 0);
    assert_eq!(setup.token.balance(&setup.crowdfund_id), 15);

    advance_ledger(&setup.env, 10);
    setup.crowdfund.client().withdraw(&setup.recipient_id);

    assert_eq!(setup.token.balance(&setup.user1_id), 0);
    assert_eq!(setup.token.balance(&setup.user2_id), 0);
    assert_eq!(setup.token.balance(&setup.crowdfund_id), 0);
    assert_eq!(setup.token.balance(&setup.recipient_id), 15);
}

#[test]
#[should_panic(expected = "sale is still running")]
fn sale_still_running() {
    let setup = Setup::new();
    setup.crowdfund.client().withdraw(&setup.recipient_id);
}

#[test]
#[should_panic(expected = "sale was successful, only the recipient may withdraw")]
fn sale_successful_only_recipient() {
    let setup = Setup::new();
    setup.token.with_source_account(&setup.user2).incr_allow(
        &Signature::Invoker,
        &0,
        &setup.crowdfund_id,
        &5,
    );
    setup.crowdfund.client().deposit(&setup.user2_id, &5);
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.user1_id);
}

#[test]
#[should_panic(expected = "sale expired, the recipient may not withdraw")]
fn sale_expired_recipient_not_allowed() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.recipient_id);
}

#[test]
#[should_panic(expected = "sale is not running")]
fn sale_not_running() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().deposit(&setup.user1_id, &1);
}
