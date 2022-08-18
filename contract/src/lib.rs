#![no_std]
use soroban_sdk::{contractimpl, BigInt, Env, EnvVal, FixedBinary, IntoVal, RawVal};
use soroban_token_contract as token;
use token::public_types::{Identifier, KeyedAuthorization, U256};

#[derive(Clone, Copy)]
#[repr(u32)]
pub enum DataKey {
    Owner = 0,
    DeadlineLedger = 1,
    TargetAmount = 2,
    Token = 3,
}

impl IntoVal<Env, RawVal> for DataKey {
    fn into_val(self, env: &Env) -> RawVal {
        (self as u32).into_val(env)
    }
}

#[derive(Clone, Copy, PartialEq)]
#[repr(u32)]
pub enum State {
    Running = 0,
    Success = 1,
    Expired = 2,
}

impl IntoVal<Env, RawVal> for State {
    fn into_val(self, env: &Env) -> RawVal {
        (self as u32).into_val(env)
    }
}

fn get_contract_id(e: &Env) -> Identifier {
    Identifier::Contract(e.get_current_contract().into())
}

fn get_current_ledger(e: &Env) -> u32 {
    e.get_current_ledger().number()
}

fn get_owner(e: &Env) -> Identifier {
    e.contract_data().get_unchecked(DataKey::Owner).unwrap()
}

fn get_deadline_ledger(e: &Env) -> u32 {
    e.contract_data()
        .get_unchecked(DataKey::DeadlineLedger)
        .unwrap()
}

fn get_target_amount(e: &Env) -> BigInt {
    e.contract_data()
        .get_unchecked(DataKey::TargetAmount)
        .unwrap()
}

fn get_token(e: &Env) -> FixedBinary<32> {
    e.contract_data().get_unchecked(DataKey::Token).unwrap()
}

fn get_balance(e: &Env, contract_id: FixedBinary<32>) -> BigInt {
    token::balance(e, &contract_id, &get_contract_id(e))
}

fn get_state(e: &Env) -> State {
    let deadline_ledger = get_deadline_ledger(&e);
    let target_amount = get_target_amount(&e);
    let token_id = get_token(&e);
    let token_balance = get_balance(&e, token_id);
    let current_ledger = get_current_ledger(&e);

    if current_ledger < deadline_ledger {
        return State::Running;
    };
    if token_balance >= target_amount {
        return State::Success;
    };
    return State::Expired;
}

fn put_owner(e: &Env, owner: Identifier) {
    e.contract_data().set(DataKey::Owner, owner);
}

fn put_deadline_ledger(e: &Env, deadline_ledger: u32) {
    e.contract_data()
        .set(DataKey::DeadlineLedger, deadline_ledger);
}

fn put_target_amount(e: &Env, target_amount: BigInt) {
    e.contract_data().set(DataKey::TargetAmount, target_amount);
}

fn put_token(e: &Env, token: U256) {
    e.contract_data().set(DataKey::Token, token);
}

fn transfer(e: &Env, contract_id: FixedBinary<32>, to: Identifier, amount: BigInt) {
    token::xfer(e, &contract_id, &KeyedAuthorization::Contract, &to, &amount);
}

struct Crowdfund;

/*
How to use this contract to run a crowdfund

1. Call initialize(provider, deadline_ledger, target_amount, token).
2. Donors send USDC to this contract's address
3. Once the target_amount is reached, the contract owner can withdraw the USDC.
4. If the deadline_ledger passes without reaching the target_amount, the donors can withdraw their USDC again.
*/
#[contractimpl]
impl Crowdfund {
    pub fn initialize(
        e: Env,
        owner: Identifier,
        deadline_ledger: u32,
        target_amount: BigInt,
        token: U256,
    ) {
        put_owner(&e, owner);
        put_deadline_ledger(&e, deadline_ledger);
        put_target_amount(&e, target_amount);
        put_token(&e, token);
    }

    pub fn token(e: Env) -> FixedBinary<32> {
        get_token(&e)
    }

    pub fn state(e: Env) -> u32 {
        get_state(&e) as u32
    }

    pub fn deposit(e: Env, to: Identifier, amount: BigInt) {
        if get_state(&e) != State::Running {
            panic!("sale is not running")
        };

        token::xfer_from(
            &e,
            &get_token(&e),
            &KeyedAuthorization::Contract,
            &to,
            &get_contract_id(&e),
            &amount,
        );
    }

    // TODO: Track deposited amounts per-donor, so you can't just withdraw all
    // TODO: Authenticate this with more than the destination address, maybe?
    pub fn withdraw(e: Env, to: Identifier, amount: BigInt) {
        let state = get_state(&e);
        let owner = get_owner(&e);
        match (state, to) {
            (State::Running, _) => {
                panic!("sale is still running")
            }
            (State::Success, to) => {
                if to != owner {
                    panic!("sale was successful, only the owner may withdraw")
                }
            }
            (State::Expired, to) => {
                if to == owner {
                    panic!("sale expired, the owner may not withdraw")
                }
            }
        };

        let token_id = get_token(&e);
        let token_balance = get_balance(&e, token_id);
        transfer(&e, token_id, to, amount);
    }
}
