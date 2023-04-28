#![cfg(test)]

use super::testutils::{register_test_contract as register_crowdfund, Crowdfund};
use super::token::Client as Token;
use soroban_sdk::{
    testutils::{Address as AddressTestTrait, Events, Ledger},
    vec, Address, BytesN, Env, IntoVal, RawVal, Symbol, Vec,
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
        let contract_token = e.register_stellar_asset_contract(token_admin);
        let token = Token::new(&e, &contract_token);

        // Create the crowdfunding contract
        let (contract_crowdfund, crowdfund) =
            create_crowdfund_contract(&e, &recipient, deadline, &target_amount, &contract_token);
        let crowdfund_id = Address::from_contract_id(&e, &contract_crowdfund);

        // Mint some tokens to work with
        token.mint(&user1, &10);
        token.mint(&user2, &8);

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
fn test_events() {
    let setup = Setup::new();
    setup.crowdfund.client().deposit(&setup.user2, &5);
    setup.crowdfund.client().deposit(&setup.user2, &3);

    let crowd_fund_contract_id = setup.crowdfund_id.contract_id().unwrap();
    let mut crowd_fund_events: Vec<(BytesN<32>, soroban_sdk::Vec<RawVal>, RawVal)> =
        vec![&setup.env];

    // there are SAC events emitted also, filter those away, not asserting that aspect
    setup
        .env
        .events()
        .all()
        .iter()
        .map(core::result::Result::unwrap)
        .filter(|event| event.0 == crowd_fund_contract_id)
        .for_each(|event| crowd_fund_events.push_back(event));

    assert_eq!(
        crowd_fund_events,
        vec![
            &setup.env,
            (
                setup.crowdfund_id.contract_id().unwrap(),
                (Symbol::new(&setup.env, "pledged_amount_changed"),).into_val(&setup.env),
                10_i128.into_val(&setup.env)
            ),
            (
                setup.crowdfund_id.contract_id().unwrap(),
                (Symbol::new(&setup.env, "pledged_amount_changed"),).into_val(&setup.env),
                15_i128.into_val(&setup.env)
            ),
            (
                // validate that this event only emitted once, ensuing deposits over the
                // target before expiration, don't trigger this one again
                setup.crowdfund_id.contract_id().unwrap(),
                (Symbol::new(&setup.env, "target_reached"),).into_val(&setup.env),
                (15_i128, 15_i128).into_val(&setup.env)
            ),
            (
                setup.crowdfund_id.contract_id().unwrap(),
                (Symbol::new(&setup.env, "pledged_amount_changed"),).into_val(&setup.env),
                18_i128.into_val(&setup.env)
            ),
        ]
    );
}

#[test]
fn test_success() {
    let setup = Setup::new();
    setup.crowdfund.client().deposit(&setup.user2, &5);

    assert_eq!(setup.token.balance(&setup.user1), 0);
    assert_eq!(setup.token.balance(&setup.user2), 3);
    assert_eq!(setup.token.balance(&setup.crowdfund_id), 15);

    advance_ledger(&setup.env, 10);
    setup.crowdfund.client().withdraw(&setup.recipient);

    assert_eq!(setup.token.balance(&setup.user1), 0);
    assert_eq!(setup.token.balance(&setup.user2), 3);
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
#[should_panic(expected = "sale was successful, only the recipient may withdraw")]
fn sale_successful_non_recipient_still_denied_after_withdrawal() {
    let setup = Setup::new();
    setup.crowdfund.client().deposit(&setup.user2, &5);
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.recipient);
    setup.crowdfund.client().withdraw(&setup.user1);
}

#[test]
#[should_panic(expected = "sale was successful, recipient has withdrawn funds already")]
fn sale_successful_recipient_withdraws_only_once() {
    let setup = Setup::new();
    setup.crowdfund.client().deposit(&setup.user2, &5);
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.recipient);
    setup.crowdfund.client().withdraw(&setup.recipient);
}

#[test]
#[should_panic(expected = "sale expired, the recipient may not withdraw")]
fn sale_expired_recipient_not_allowed() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().withdraw(&setup.user1);
    setup.crowdfund.client().withdraw(&setup.recipient);
}

#[test]
#[should_panic(expected = "sale is not running")]
fn sale_not_running() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup.crowdfund.client().deposit(&setup.user1, &1);
}
