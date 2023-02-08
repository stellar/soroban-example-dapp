#![cfg(test)]

use super::testutils::{register_test_contract as register_crowdfund, Crowdfund};
use super::token::Client as Token;
use soroban_sdk::{
    testutils::{Address as AddressTestTrait, Ledger},
    Address, BytesN, Env,
};

fn create_crowdfund_contract(
    e: &Env,
    recipient: &Address,
    deadline: u64,
    target_amount: &i128,
    token: &BytesN<32>,
) -> (BytesN<32>, Crowdfund) {
    let id = register_crowdfund(e);
    let crowdfund = Crowdfund::new(e, &id.clone().into());
    crowdfund
        .client()
        .initialize(recipient, &deadline, target_amount, token);
    (id, crowdfund)
}

fn advance_ledger(e: &Env, delta: u64) {
    e.ledger().with_mut(|l| {
        l.timestamp += delta;
    });
}

struct Setup {
    env: Env,
    recipient: Address,
    user1: Address,
    user2: Address,
    token: Token,
    crowdfund: Crowdfund,
    crowdfund_id: Address,
}

/// Sets up a crowdfund with -
/// 1. Deadline 10 seconds from now.
/// 2. Target amount of 15.
/// 3. One deposit of 10 from user1.
///
impl Setup {
    fn new() -> Self {
        let e: Env = soroban_sdk::Env::default();
        let recipient = Address::random(&e);
        let user1 = Address::random(&e);
        let user2 = Address::random(&e);

        // the deadline is 10 seconds from now
        let deadline = e.ledger().timestamp() + 10;
        let target_amount: i128 = 15;

        // Create the token contract
        let token_admin = Address::random(&e);
        let contract_token = e.register_stellar_asset_contract(token_admin.clone());
        let token = Token::new(&e, &contract_token);

        // Create the crowdfunding contract
        let (contract_crowdfund, crowdfund) =
            create_crowdfund_contract(&e, &recipient, deadline, &target_amount, &contract_token);
        let crowdfund_id = Address::from_contract_id(&e, &contract_crowdfund);

        // Mint some tokens to work with
        token.mint(&token_admin, &user1, &10);
        token.mint(&token_admin, &user2, &5);

        crowdfund.client().deposit(&user1, &10);

        Self {
            env: e,
            recipient,
            user1,
            user2,
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

    setup.crowdfund.client().withdraw(&setup.user1);

    assert_eq!(setup.token.balance(&setup.user1), 10);
    assert_eq!(setup.token.balance(&setup.crowdfund_id), 0);
}

#[test]
fn test_success() {
    let setup = Setup::new();
    setup.crowdfund.client().deposit(&setup.user2, &5);

    assert_eq!(setup.token.balance(&setup.user1), 0);
    assert_eq!(setup.token.balance(&setup.user2), 0);
    assert_eq!(setup.token.balance(&setup.crowdfund_id), 15);

    advance_ledger(&setup.env, 10);
    setup.crowdfund.client().withdraw(&setup.recipient);

    assert_eq!(setup.token.balance(&setup.user1), 0);
    assert_eq!(setup.token.balance(&setup.user2), 0);
    assert_eq!(setup.token.balance(&setup.crowdfund_id), 0);
    assert_eq!(setup.token.balance(&setup.recipient), 15);
}

#[test]
#[should_panic(expected = "sale is still running")]
fn sale_still_running() {
    let setup = Setup::new();
    setup.crowdfund.client().withdraw(&setup.recipient);
}

#[test]
#[should_panic(expected = "sale was successful, only the recipient may withdraw")]
fn sale_successful_only_recipient() {
    let setup = Setup::new();
    setup.crowdfund.client().deposit(&setup.user2, &5);
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.user1);
}

#[test]
#[should_panic(expected = "sale expired, the recipient may not withdraw")]
fn sale_expired_recipient_not_allowed() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.recipient);
}

#[test]
#[should_panic(expected = "sale is not running")]
fn sale_not_running() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().deposit(&setup.user1, &1);
}
