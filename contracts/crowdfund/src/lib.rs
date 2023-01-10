#![no_std]
use soroban_auth::{Identifier, Signature};
use soroban_sdk::{contractimpl, contracttype, BytesN, Env, IntoVal, RawVal};

mod token {
    soroban_sdk::contractimport!(file = "../token/soroban_token_spec.wasm");
}

mod test;
mod testutils;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Deadline,
    Recipient,
    Started,
    Target,
    Token,
    User(Identifier),
}

#[derive(Clone, Copy, PartialEq, Eq)]
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
    Identifier::Contract(e.get_current_contract())
}

fn get_ledger_timestamp(e: &Env) -> u64 {
    e.ledger().timestamp()
}

fn get_recipient(e: &Env) -> Identifier {
    e.storage()
        .get(DataKey::Recipient)
        .expect("not initialized")
        .unwrap()
}

fn get_deadline(e: &Env) -> u64 {
    e.storage()
        .get(DataKey::Deadline)
        .expect("not initialized")
        .unwrap()
}

fn get_started(e: &Env) -> u64 {
    e.storage()
        .get(DataKey::Started)
        .expect("not initialized")
        .unwrap()
}

fn get_target_amount(e: &Env) -> i128 {
    e.storage()
        .get(DataKey::Target)
        .expect("not initialized")
        .unwrap()
}

fn get_token(e: &Env) -> BytesN<32> {
    e.storage()
        .get(DataKey::Token)
        .expect("not initialized")
        .unwrap()
}

fn get_user_deposited(e: &Env, user: &Identifier) -> i128 {
    e.storage()
        .get(DataKey::User(user.clone()))
        .unwrap_or(Ok(0))
        .unwrap()
}

fn get_balance(e: &Env, contract_id: &BytesN<32>) -> i128 {
    let client = token::Client::new(e, contract_id);
    client.balance(&get_contract_id(e))
}

fn get_state(e: &Env) -> State {
    let deadline = get_deadline(e);
    let target_amount = get_target_amount(e);
    let token_id = get_token(e);
    let token_balance = get_balance(e, &token_id);
    let current_timestamp = get_ledger_timestamp(e);

    if current_timestamp < deadline {
        return State::Running;
    };
    if token_balance >= target_amount {
        return State::Success;
    };
    State::Expired
}

fn set_user_deposited(e: &Env, user: &Identifier, amount: &i128) {
    e.storage().set(DataKey::User(user.clone()), amount);
}

fn transfer(e: &Env, contract_id: &BytesN<32>, to: &Identifier, amount: &i128) {
    let nonce: i128 = 0;
    let client = token::Client::new(e, contract_id);
    client.xfer(&Signature::Invoker, &nonce, to, amount);
}

struct Crowdfund;

/*
How to use this contract to run a crowdfund

1. Call initialize(recipient, deadline_unix_epoch, target_amount, token).
2. Donors send tokens to this contract's address
3. Once the target_amount is reached, the contract recipient can withdraw the tokens.
4. If the deadline passes without reaching the target_amount, the donors can withdraw their tokens again.
*/
#[contractimpl]
#[allow(clippy::needless_pass_by_value)]
impl Crowdfund {
    pub fn initialize(
        e: Env,
        recipient: Identifier,
        deadline: u64,
        target_amount: i128,
        token: BytesN<32>,
    ) {
        assert!(!e.storage().has(DataKey::Recipient), "already initialized");

        e.storage().set(DataKey::Recipient, recipient);
        e.storage().set(DataKey::Started, get_ledger_timestamp(&e));
        e.storage().set(DataKey::Deadline, deadline);
        e.storage().set(DataKey::Target, target_amount);
        e.storage().set(DataKey::Token, token);
    }

    pub fn recipient(e: Env) -> Identifier {
        get_recipient(&e)
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

    pub fn target(e: Env) -> i128 {
        get_target_amount(&e)
    }

    pub fn token(e: Env) -> BytesN<32> {
        get_token(&e)
    }

    pub fn balance(e: Env, user: Identifier) -> i128 {
        let recipient = get_recipient(&e);
        if get_state(&e) == State::Success {
            if user != recipient {
                return 0;
            };
            return get_balance(&e, &get_token(&e));
        };

        get_user_deposited(&e, &user)
    }

    pub fn deposit(e: Env, user: Identifier, amount: i128) {
        assert!(amount > 0, "amount must be positive");
        assert!(get_state(&e) == State::Running, "sale is not running");

        let recipient = get_recipient(&e);
        assert!(user != recipient, "recipient may not deposit");

        let balance = get_user_deposited(&e, &user);
        set_user_deposited(&e, &user, &(balance + amount));

        let nonce: i128 = 0;
        let client = token::Client::new(&e, get_token(&e));
        client.xfer_from(
            &Signature::Invoker,
            &nonce,
            &user,
            &get_contract_id(&e),
            &amount,
        );
    }

    pub fn withdraw(e: Env, to: Identifier) {
        let state = get_state(&e);
        let recipient = get_recipient(&e);

        match state {
            State::Running => {
                panic!("sale is still running")
            }
            State::Success => {
                assert!(
                    to == recipient,
                    "sale was successful, only the recipient may withdraw"
                );
                let token = get_token(&e);
                transfer(&e, &token, &recipient, &get_balance(&e, &token));
            }
            State::Expired => {
                assert!(
                    to != recipient,
                    "sale expired, the recipient may not withdraw"
                );

                // Withdraw full amount
                let balance = get_user_deposited(&e, &to);
                set_user_deposited(&e, &to, &0);
                transfer(&e, &get_token(&e), &to, &balance);
            }
        };
    }
}
