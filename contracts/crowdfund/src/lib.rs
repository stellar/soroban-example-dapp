#![no_std]
use soroban_auth::{Identifier, Signature};
use soroban_sdk::{contractimpl, contracttype, BigInt, BytesN, Env, IntoVal, RawVal};
use soroban_token_contract::TokenClient;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Deadline,
    Owner,
    Started,
    Target,
    Token,
    User(Identifier),
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

fn get_ledger_timestamp(e: &Env) -> u64 {
    e.ledger().timestamp()
}

fn get_owner(e: &Env) -> Identifier {
    e.contract_data().get_unchecked(DataKey::Owner).unwrap()
}

fn get_deadline(e: &Env) -> u64 {
    e.contract_data().get_unchecked(DataKey::Deadline).unwrap()
}

fn get_started(e: &Env) -> u64 {
    e.contract_data().get_unchecked(DataKey::Started).unwrap()
}

fn get_target_amount(e: &Env) -> BigInt {
    e.contract_data().get_unchecked(DataKey::Target).unwrap()
}

fn get_token(e: &Env) -> BytesN<32> {
    e.contract_data().get_unchecked(DataKey::Token).unwrap()
}

fn get_user_deposited(e: &Env, user: &Identifier) -> BigInt {
    e.contract_data()
        .get(DataKey::User(user.clone()))
        .unwrap_or_else(|| Ok(BigInt::zero(&e)))
        .unwrap()
}

fn get_balance(e: &Env, contract_id: BytesN<32>) -> BigInt {
    let client = TokenClient::new(&e, &contract_id);
    client.balance(&get_contract_id(e))
}

fn get_state(e: &Env) -> State {
    let deadline = get_deadline(&e);
    let target_amount = get_target_amount(&e);
    let token_id = get_token(&e);
    let token_balance = get_balance(&e, token_id);
    let current_timestamp = get_ledger_timestamp(&e);

    if current_timestamp < deadline {
        return State::Running;
    };
    if token_balance >= target_amount {
        return State::Success;
    };
    return State::Expired;
}

fn set_user_deposited(e: &Env, user: &Identifier, amount: BigInt) {
    e.contract_data().set(DataKey::User(user.clone()), amount)
}

fn transfer(e: &Env, contract_id: BytesN<32>, to: &Identifier, amount: &BigInt) {
    let nonce: BigInt = BigInt::zero(&e);
    let client = TokenClient::new(&e, &contract_id);
    client.xfer(&Signature::Contract, &nonce, to, amount);
}

struct Crowdfund;

/*
How to use this contract to run a crowdfund

1. Call initialize(provider, deadline_unix_epoch, target_amount, token).
2. Donors send USDC to this contract's address
3. Once the target_amount is reached, the contract owner can withdraw the USDC.
4. If the deadline passes without reaching the target_amount, the donors can withdraw their USDC again.
*/
#[contractimpl]
impl Crowdfund {
    pub fn initialize(
        e: Env,
        owner: Identifier,
        deadline: i64, //TODO: Why is this a i64 instead of u64?
        target_amount: BigInt,
        token: BytesN<32>,
    ) {
        if e.contract_data().has(DataKey::Owner) {
            panic!("already initialized");
        }
        if deadline < 0 {
            panic!("deadline must be positive");
        }
        e.contract_data().set(DataKey::Owner, owner);
        e.contract_data()
            .set(DataKey::Started, get_ledger_timestamp(&e));
        e.contract_data().set(DataKey::Deadline, deadline as u64);
        e.contract_data().set(DataKey::Target, target_amount);
        e.contract_data().set(DataKey::Token, token);
    }

    pub fn deadline(e: Env) -> u64 {
        get_deadline(&e)
    }

    pub fn started(e: Env) -> u64 {
        get_started(&e)
    }

    pub fn state(e: Env) -> u32 {
        get_state(&e) as u32
    }

    pub fn target(e: Env) -> BigInt {
        get_target_amount(&e)
    }

    pub fn token(e: Env) -> BytesN<32> {
        get_token(&e)
    }

    pub fn balance(e: Env, user: Identifier) -> BigInt {
        let owner = get_owner(&e);
        if get_state(&e) == State::Success {
            if user != owner {
                return BigInt::zero(&e);
            };
            return get_balance(&e, get_token(&e));
        };

        get_user_deposited(&e, &user)
    }

    pub fn deposit(e: Env, user: Identifier, amount: BigInt) {
        if get_state(&e) != State::Running {
            panic!("sale is not running")
        };

        let balance = get_user_deposited(&e, &user);
        set_user_deposited(&e, &user, balance + amount.clone());

        let nonce = BigInt::zero(&e);
        let client = TokenClient::new(&e, &get_token(&e));
        client.xfer_from(
            &Signature::Contract,
            &nonce,
            &user,
            &get_contract_id(&e),
            &amount,
        );
    }

    pub fn withdraw(e: Env, to: Identifier) {
        let state = get_state(&e);
        let owner = get_owner(&e);

        match state {
            State::Running => {
                panic!("sale is still running")
            }
            State::Success => {
                if to != owner {
                    panic!("sale was successful, only the owner may withdraw")
                }
                transfer(&e, get_token(&e), &owner, &get_balance(&e, get_token(&e)))
            }
            State::Expired => {
                // TODO: Is this right? What if the owner called deposit?
                if to == owner {
                    panic!("sale expired, the owner may not withdraw")
                }

                // Withdraw full amount
                let balance = get_user_deposited(&e, &to);
                transfer(&e, get_token(&e), &to, &balance);
                set_user_deposited(&e, &to, BigInt::zero(&e));
            }
        };
    }
}
