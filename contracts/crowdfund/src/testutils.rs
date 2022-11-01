#![cfg(test)]

use crate::CrowdfundClient;

use soroban_sdk::{BytesN, Env};

pub fn register_test_contract(e: &Env, contract_id: &[u8; 32]) {
    let contract_id = BytesN::from_array(e, contract_id);
    e.register_contract(&contract_id, crate::Crowdfund {});
}

pub struct Crowdfund {
    env: Env,
    contract_id: BytesN<32>,
}

impl Crowdfund {
    #[must_use]
    pub fn client(&self) -> CrowdfundClient {
        CrowdfundClient::new(&self.env, &self.contract_id)
    }

    #[must_use]
    pub fn new(env: &Env, contract_id: &[u8; 32]) -> Self {
        Self {
            env: env.clone(),
            contract_id: BytesN::from_array(env, contract_id),
        }
    }
}
