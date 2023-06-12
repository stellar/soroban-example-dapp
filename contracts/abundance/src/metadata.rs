use soroban_sdk::{Bytes, Env};
use soroban_token_sdk::{TokenMetadata, TokenUtils};

pub fn read_decimal(e: &Env) -> u32 {
    let util = TokenUtils::new(e);
    util.get_metadata_unchecked().unwrap().decimal
}

pub fn read_name(e: &Env) -> Bytes {
    let util = TokenUtils::new(e);
    util.get_metadata_unchecked().unwrap().name
}

pub fn read_symbol(e: &Env) -> Bytes {
    let util = TokenUtils::new(e);
    util.get_metadata_unchecked().unwrap().symbol
}

pub fn write_metadata(e: &Env, metadata: TokenMetadata) {
    let util = TokenUtils::new(e);
    util.set_metadata(&metadata);
}
