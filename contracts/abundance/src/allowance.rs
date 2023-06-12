use crate::storage_types::{AllowanceDataKey, DataKey};
use soroban_sdk::{Address, Env};

pub fn read_allowance(e: &Env, from: Address, spender: Address) -> i128 {
    let key = DataKey::Allowance(AllowanceDataKey { from, spender });
    if let Some(allowance) = e.storage().get(&key) {
        allowance.unwrap()
    } else {
        0
    }
}

pub fn write_allowance(e: &Env, from: Address, spender: Address, amount: i128) {
    let key = DataKey::Allowance(AllowanceDataKey { from, spender });
    e.storage().set(&key, &amount);
}

pub fn spend_allowance(e: &Env, from: Address, spender: Address, amount: i128) {
    let allowance = read_allowance(e, from.clone(), spender.clone());
    if allowance < amount {
        panic!("insufficient allowance");
    }
    write_allowance(e, from, spender, allowance - amount);
}
