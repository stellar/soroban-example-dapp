#![cfg(test)]

use crate::CrowdfundClient;

use soroban_sdk::{Address, Env};

pub fn register_test_contract(e: &Env) -> Address {
    e.register_contract(None, crate::Crowdfund {})
}

pub struct Crowdfund {
    env: Env,
    contract_id: Address,
}

impl Crowdfund {
    #[must_use]
    pub fn client(&self) -> CrowdfundClient {
        CrowdfundClient::new(&self.env, &self.contract_id)
    }

    #[must_use]
    pub fn new(env: &Env, contract_id: Address) -> Self {
        Self {
            env: env.clone(),
            contract_id,
        }
    }
}
