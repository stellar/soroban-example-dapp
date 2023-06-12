use soroban_sdk::{Address, Env, Symbol};

pub(crate) fn increase_allowance(e: &Env, from: Address, to: Address, amount: i128) {
    let topics = (Symbol::new(e, "increase_allowance"), from, to);
    e.events().publish(topics, amount);
}

pub(crate) fn decrease_allowance(e: &Env, from: Address, to: Address, amount: i128) {
    let topics = (Symbol::new(e, "decrease_allowance"), from, to);
    e.events().publish(topics, amount);
}

pub(crate) fn transfer(e: &Env, from: Address, to: Address, amount: i128) {
    let topics = (Symbol::short("transfer"), from, to);
    e.events().publish(topics, amount);
}

pub(crate) fn mint(e: &Env, admin: Address, to: Address, amount: i128) {
    let topics = (Symbol::short("mint"), admin, to);
    e.events().publish(topics, amount);
}

pub(crate) fn clawback(e: &Env, admin: Address, from: Address, amount: i128) {
    let topics = (Symbol::short("clawback"), admin, from);
    e.events().publish(topics, amount);
}

pub(crate) fn set_authorized(e: &Env, admin: Address, id: Address, authorize: bool) {
    let topics = (Symbol::new(e, "set_authorized"), admin, id);
    e.events().publish(topics, authorize);
}

pub(crate) fn set_admin(e: &Env, admin: Address, new_admin: Address) {
    let topics = (Symbol::short("set_admin"), admin);
    e.events().publish(topics, new_admin);
}

pub(crate) fn burn(e: &Env, from: Address, amount: i128) {
    let topics = (Symbol::short("burn"), from);
    e.events().publish(topics, amount);
}
