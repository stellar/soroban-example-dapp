#![cfg(test)]
extern crate std;

use crate::{contract::Token, TokenClient};
use soroban_sdk::{testutils::{Address as _, AuthorizedInvocation, AuthorizedFunction}, Address, Env, IntoVal, Symbol, String, vec};


#[test]
fn test() {
    let e = Env::default();
    e.mock_all_auths();

    let admin1 = Address::random(&e);
    let admin2 = Address::random(&e);
    let user1 = Address::random(&e);
    let user2 = Address::random(&e);
    let user3 = Address::random(&e);
    let contract_id = e.register_contract(None, Token {});
    let token = TokenClient::new(&e, &contract_id);
    token.initialize(&admin1, &7, &String::from_slice(&e ,"name"), &String::from_slice(&e, "symbol"));
    token.mock_all_auths().mint(&user1, &1000);
    assert_eq!(
        e.auths(),
        std::vec![(
            user1.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "mint"),
                    (&user1, 1000_i128).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.balance(&user1), 1000);

    token.mock_all_auths().increase_allowance(&user2, &user3, &500);
    assert_eq!(
        e.auths(),
        std::vec![(
            user2.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "increase_allowance"),
                    (&user2, &user3, 500_i128).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.allowance(&user2, &user3), 500);

    token.mock_all_auths().transfer(&user1, &user2, &600);
    assert_eq!(
        e.auths(),
        std::vec![(
            user1.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "transfer"),
                    (&user1, &user2, 600_i128).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.balance(&user1), 400);
    assert_eq!(token.balance(&user2), 600);

    token.mock_all_auths().transfer_from(&user3, &user2, &user1, &400);
    assert_eq!(
        e.auths(),
        std::vec![(
            user3.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "transfer_from"),
                    (&user3, &user2, &user1,400_i128).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.balance(&user1), 800);
    assert_eq!(token.balance(&user2), 200);

    token.mock_all_auths().transfer(&user1, &user3, &300);
    assert_eq!(token.balance(&user1), 500);
    assert_eq!(token.balance(&user3), 300);

    token.mock_all_auths().set_admin(&admin2);
    assert_eq!(
        e.auths(),
        std::vec![(
            admin1.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "set_admin"),
                    vec![&e, admin2.into_val(&e)]
                )),
                sub_invocations: std::vec![]
            }
        )]
    );

    token.mock_all_auths().set_authorized(&user2, &false);
    assert_eq!(
        e.auths(),
        std::vec![(
            admin2.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "set_authorized"),
                    (&user2, false).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.authorized(&user2), false);

    token.mock_all_auths().set_authorized(&user3, &true);
    assert_eq!(token.authorized(&user3), true);

    token.mock_all_auths().clawback(&user3, &100);
    assert_eq!(
        e.auths(),
        std::vec![(
            admin2.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "clawback"),
                    (&user3, 100_i128).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.balance(&user3), 200);

    // Increase by 400, with an existing 100 = 500
    token.mock_all_auths().increase_allowance(&user2, &user3, &400);
    assert_eq!(token.allowance(&user2, &user3), 500);
    token.mock_all_auths().decrease_allowance(&user2, &user3, &501);
    assert_eq!(
        e.auths(),
        std::vec![(
            user2.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "decrease_allowance"),
                    (&user2, &user3, 501_i128).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.allowance(&user2, &user3), 0);
}

#[test]
fn test_burn() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::random(&e);
    let user1 = Address::random(&e);
    let user2 = Address::random(&e);
    let contract_id = e.register_contract(None, Token {});
    let token = TokenClient::new(&e, &contract_id);
    token.initialize(&admin, &7, &String::from_slice(&e ,"name"), &String::from_slice(&e, "symbol"));

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    token.increase_allowance(&user1, &user2, &500);
    assert_eq!(token.allowance(&user1, &user2), 500);

    token.burn_from(&user2, &user1, &500);
    assert_eq!(
        e.auths(),
        std::vec![(
            user2.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "burn_from"),
                    (&user2, &user1, 500_i128).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.allowance(&user1, &user2), 0);
    assert_eq!(token.balance(&user1), 500);
    assert_eq!(token.balance(&user2), 0);

    token.burn(&user1, &500);
    assert_eq!(
        e.auths(),
        std::vec![(
            user1.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    contract_id.clone(),
                    Symbol::new(&e, "burn"),
                    (&user1, 500_i128).into_val(&e)
                )),
                sub_invocations: std::vec![]
            }
        )]
    );
    assert_eq!(token.balance(&user1), 0);
    assert_eq!(token.balance(&user2), 0);
}

#[test]
#[should_panic(expected = "insufficient balance")]
fn transfer_insufficient_balance() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::random(&e);
    let user1 = Address::random(&e);
    let user2 = Address::random(&e);
    let contract_id = e.register_contract(None, Token {});
    let token = TokenClient::new(&e, &contract_id);
    token.initialize(&admin, &7, &String::from_slice(&e ,"name"), &String::from_slice(&e, "symbol"));

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    token.transfer(&user1, &user2, &1001);
}

#[test]
#[should_panic(expected = "can't receive when deauthorized")]
fn transfer_receive_deauthorized() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::random(&e);
    let user1 = Address::random(&e);
    let user2 = Address::random(&e);
    let contract_id = e.register_contract(None, Token {});
    let token = TokenClient::new(&e, &contract_id);
    token.initialize(&admin, &7, &String::from_slice(&e ,"name"), &String::from_slice(&e, "symbol"));

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    token.set_authorized(&user2, &false);
    token.transfer(&user1, &user2, &1);
}

#[test]
#[should_panic(expected = "can't spend when deauthorized")]
fn transfer_spend_deauthorized() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::random(&e);
    let user1 = Address::random(&e);
    let user2 = Address::random(&e);
    let contract_id = e.register_contract(None, Token {});
    let token = TokenClient::new(&e, &contract_id);
    token.initialize(&admin, &7, &String::from_slice(&e ,"name"), &String::from_slice(&e, "symbol"));

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    token.set_authorized(&user1, &false);
    token.transfer(&user1, &user2, &1);
}

#[test]
#[should_panic(expected = "insufficient allowance")]
fn transfer_from_insufficient_allowance() {
    let e = Env::default();
    e.mock_all_auths();

    let admin = Address::random(&e);
    let user1 = Address::random(&e);
    let user2 = Address::random(&e);
    let user3 = Address::random(&e);
    let contract_id = e.register_contract(None, Token {});
    let token = TokenClient::new(&e, &contract_id);
    token.initialize(&admin, &7, &String::from_slice(&e ,"name"), &String::from_slice(&e, "symbol"));

    token.mint(&user1, &1000);
    assert_eq!(token.balance(&user1), 1000);

    token.increase_allowance(&user1, &user3, &100);
    assert_eq!(token.allowance(&user1, &user3), 100);

    token.transfer_from(&user3, &user1, &user2, &101);
}

#[test]
#[should_panic(expected = "already initialized")]
fn initialize_already_initialized() {
    let e = Env::default();
    let admin = Address::random(&e);
    let contract_id = e.register_contract(None, Token {});
    let token = TokenClient::new(&e, &contract_id);
    token.initialize(&admin, &7, &String::from_slice(&e ,"name"), &String::from_slice(&e, "symbol"));

    token.initialize(&admin, &10, &String::from_slice(&e ,"name"), &String::from_slice(&e, "symbol"));
}

#[test]
#[should_panic(expected = "Decimal must fit in a u8")]
fn decimal_is_over_max() {
    let e = Env::default();
    let admin = Address::random(&e);
    let token = TokenClient::new(&e, &e.register_contract(None, Token {}));
    token.initialize(
        &admin,
        &(u32::from(u8::MAX) + 1),
        &String::from_slice(&e, "name"),
        &String::from_slice(&e, "symbol"),
    );
}
