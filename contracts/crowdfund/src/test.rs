#![cfg(test)]

use super::testutils::{register_test_contract as register_crowdfund, Crowdfund};
use soroban_sdk::{
    testutils::{Address as AddressTestTrait, Events, Ledger},
    token, vec, Address, Env, IntoVal, Symbol, Val, Vec,
};

fn create_crowdfund_contract(
    e: &Env,
    recipient: &Address,
    deadline: u64,
    target_amount: &i128,
    token: &Address,
) -> (Address, Crowdfund) {
    let id = register_crowdfund(e);
    let crowdfund = Crowdfund::new(e, id.clone());
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

struct Setup<'a> {
    env: Env,
    recipient: Address,
    user1: Address,
    user2: Address,
    token: token::Client<'a>,
    crowdfund: Crowdfund,
    crowdfund_id: Address,
}

fn create_token_contract<'a>(
    e: &Env,
    admin: &Address,
) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let contract_address = e.register_stellar_asset_contract(admin.clone());
    (
        token::Client::new(e, &contract_address),
        token::StellarAssetClient::new(e, &contract_address),
    )
}

/// Sets up a crowdfund with -
/// 1. Deadline 10 seconds from now.
/// 2. Target amount of 15.
/// 3. One deposit of 10 from user1.
///
impl Setup<'_> {
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
        let (token, token_admin) = create_token_contract(&e, &token_admin);

        // Create the crowdfunding contract
        let (crowdfund_id, crowdfund) =
            create_crowdfund_contract(&e, &recipient, deadline, &target_amount, &token.address);

        // Mint some tokens to work with
        token_admin.mock_all_auths().mint(&user1, &10);
        token_admin.mock_all_auths().mint(&user2, &8);

        crowdfund.client().mock_all_auths().deposit(&user1, &10);

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

    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.user1);

    assert_eq!(setup.token.balance(&setup.user1), 10);
    assert_eq!(setup.token.balance(&setup.crowdfund_id), 0);
}

#[test]
fn test_events() {
    let setup = Setup::new();
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .deposit(&setup.user2, &5);
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .deposit(&setup.user2, &3);

    let mut crowd_fund_events: Vec<(Address, soroban_sdk::Vec<Val>, Val)> = vec![&setup.env];

    // there are SAC events emitted also, filter those away, not asserting that aspect
    setup
        .env
        .events()
        .all()
        .iter()
        .filter(|event| event.0 == setup.crowdfund_id)
        .for_each(|event| crowd_fund_events.push_back(event));

    assert_eq!(
        crowd_fund_events,
        vec![
            &setup.env,
            (
                setup.crowdfund_id.clone(),
                (Symbol::new(&setup.env, "pledged_amount_changed"),).into_val(&setup.env),
                10_i128.into_val(&setup.env)
            ),
            (
                setup.crowdfund_id.clone(),
                (Symbol::new(&setup.env, "pledged_amount_changed"),).into_val(&setup.env),
                15_i128.into_val(&setup.env)
            ),
            (
                // validate that this event only emitted once, ensuing deposits over the
                // target before expiration, don't trigger this one again
                setup.crowdfund_id.clone(),
                (Symbol::new(&setup.env, "target_reached"),).into_val(&setup.env),
                (15_i128, 15_i128).into_val(&setup.env)
            ),
            (
                setup.crowdfund_id.clone(),
                (Symbol::new(&setup.env, "pledged_amount_changed"),).into_val(&setup.env),
                18_i128.into_val(&setup.env)
            ),
        ]
    );
}

#[test]
fn test_success() {
    let setup = Setup::new();
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .deposit(&setup.user2, &5);

    assert_eq!(setup.token.mock_all_auths().balance(&setup.user1), 0);
    assert_eq!(setup.token.mock_all_auths().balance(&setup.user2), 3);
    assert_eq!(
        setup.token.mock_all_auths().balance(&setup.crowdfund_id),
        15
    );

    advance_ledger(&setup.env, 10);
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.recipient);

    assert_eq!(setup.token.mock_all_auths().balance(&setup.user1), 0);
    assert_eq!(setup.token.mock_all_auths().balance(&setup.user2), 3);
    assert_eq!(setup.token.mock_all_auths().balance(&setup.crowdfund_id), 0);
    assert_eq!(setup.token.mock_all_auths().balance(&setup.recipient), 15);
}

#[test]
#[should_panic(expected = "sale is still running")]
fn sale_still_running() {
    let setup = Setup::new();
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.recipient);
}

#[test]
#[should_panic(expected = "sale was successful, only the recipient may withdraw")]
fn sale_successful_only_recipient() {
    let setup = Setup::new();
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .deposit(&setup.user2, &5);
    advance_ledger(&setup.env, 10);

    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.user1);
}

#[test]
#[should_panic(expected = "sale was successful, only the recipient may withdraw")]
fn sale_successful_non_recipient_still_denied_after_withdrawal() {
    let setup = Setup::new();
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .deposit(&setup.user2, &5);
    advance_ledger(&setup.env, 10);

    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.recipient);
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.user1);
}

#[test]
#[should_panic(expected = "sale was successful, recipient has withdrawn funds already")]
fn sale_successful_recipient_withdraws_only_once() {
    let setup = Setup::new();
    setup.crowdfund.client().deposit(&setup.user2, &5);
    advance_ledger(&setup.env, 10);

    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.recipient);
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.recipient);
}

#[test]
#[should_panic(expected = "sale expired, the recipient may not withdraw")]
fn sale_expired_recipient_not_allowed() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.user1);
    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .withdraw(&setup.recipient);
}

#[test]
#[should_panic(expected = "sale is not running")]
fn sale_not_running() {
    let setup = Setup::new();
    advance_ledger(&setup.env, 10);

    setup
        .crowdfund
        .client()
        .mock_all_auths()
        .deposit(&setup.user1, &1);
}
