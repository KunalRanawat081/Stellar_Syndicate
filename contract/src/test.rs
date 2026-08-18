#![cfg(test)]

use super::*;
use soroban_sdk::{Env, Address, String};
use soroban_sdk::testutils::Address as _;

#[test]
fn test_create_group() {
    let env = Env::default();
    let contract_id = env.register(LumenGuildContract, ());
    let client = LumenGuildContractClient::new(&env, &contract_id);

    let group_id = String::from_str(&env, "g1");
    let title = String::from_str(&env, "Summer Coffee Import");
    let desc = String::from_str(&env, "Bulk wholesale coffee import from Colombia");
    let lead = Address::generate(&env);

    client.create_group(&group_id, &title, &desc, &lead);

    let group = client.get_group(&group_id);
    assert_eq!(group.id, group_id);
    assert_eq!(group.title, title);
    assert_eq!(group.description, desc);
    assert_eq!(group.lead_buyer, lead);
}

#[test]
fn test_add_member_and_mark_paid() {
    let env = Env::default();
    let contract_id = env.register(LumenGuildContract, ());
    let client = LumenGuildContractClient::new(&env, &contract_id);

    let group_id = String::from_str(&env, "g1");
    let title = String::from_str(&env, "Summer Coffee Import");
    let desc = String::from_str(&env, "Bulk wholesale coffee import from Colombia");
    let lead = Address::generate(&env);

    client.create_group(&group_id, &title, &desc, &lead);

    let member_id = String::from_str(&env, "m1");
    let member_addr = Address::generate(&env);
    let order_amount: u32 = 50;

    // Test adding member
    client.add_member(&group_id, &member_id, &member_addr, &order_amount);

    // Verify get_members returns the new member
    let members = client.get_members(&group_id);
    assert_eq!(members.len(), 1);
    assert_eq!(members.get(0).unwrap(), member_id);

    // Verify get_member returns correct state before payment
    let member_state = client.get_member(&group_id, &member_id);
    assert!(!member_state.has_paid);
    assert_eq!(member_state.order_amount, order_amount);

    // Register a mock Stellar Asset Contract (SAC)
    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_contract_id.address();
    let token_client = soroban_sdk::token::Client::new(&env, &token_address);
    let token_admin_client = soroban_sdk::token::StellarAssetClient::new(&env, &token_address);

    // Mock all authorizations for minting and payment
    env.mock_all_auths();

    // The settlement amount is now the actual financial cost in base token units
    // (e.g. 75_000_000 = 7.5 XLM in stroops). This simulates the value produced
    // by the frontend's settlement engine.
    let settlement_amount: i128 = 75_000_000;

    // Mint enough tokens to the member address to cover the settlement
    token_admin_client.mint(&member_addr, &settlement_amount);

    // Test mark_paid — passes the explicit financial `amount`, not order_amount
    client.mark_paid(&token_address, &group_id, &member_id, &settlement_amount);

    // Verify token balances reflect the correct financial transfer
    assert_eq!(token_client.balance(&member_addr), 0);
    assert_eq!(token_client.balance(&lead), settlement_amount);

    // Verify on-chain state was updated
    let member_after = client.get_member(&group_id, &member_id);
    assert!(member_after.has_paid);
}

#[test]
#[should_panic] // GroupAlreadyExists
fn test_duplicate_group_fails() {
    let env = Env::default();
    let contract_id = env.register(LumenGuildContract, ());
    let client = LumenGuildContractClient::new(&env, &contract_id);

    let group_id = String::from_str(&env, "g1");
    let title = String::from_str(&env, "Summer Coffee Import");
    let desc = String::from_str(&env, "Bulk wholesale coffee import");
    let lead = Address::generate(&env);

    client.create_group(&group_id, &title, &desc, &lead);
    client.create_group(&group_id, &title, &desc, &lead);
}

#[test]
#[should_panic] // GroupNotFound
fn test_add_member_nonexistent_group_fails() {
    let env = Env::default();
    let contract_id = env.register(LumenGuildContract, ());
    let client = LumenGuildContractClient::new(&env, &contract_id);

    let group_id = String::from_str(&env, "invalid_group");
    let member_id = String::from_str(&env, "m1");
    let member_addr = Address::generate(&env);
    let order_amount = 50;

    client.add_member(&group_id, &member_id, &member_addr, &order_amount);
}

#[test]
#[should_panic] // AlreadyPaid
fn test_double_payment_fails() {
    let env = Env::default();
    let contract_id = env.register(LumenGuildContract, ());
    let client = LumenGuildContractClient::new(&env, &contract_id);

    let group_id = String::from_str(&env, "g1");
    let title = String::from_str(&env, "Test Group");
    let desc = String::from_str(&env, "Test");
    let lead = Address::generate(&env);
    client.create_group(&group_id, &title, &desc, &lead);

    let member_id = String::from_str(&env, "m1");
    let member_addr = Address::generate(&env);
    client.add_member(&group_id, &member_id, &member_addr, &10u32);

    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_contract_id.address();
    let token_admin_client = soroban_sdk::token::StellarAssetClient::new(&env, &token_address);

    env.mock_all_auths();
    let amount: i128 = 50_000_000;
    token_admin_client.mint(&member_addr, &(amount * 2));

    // First payment succeeds
    client.mark_paid(&token_address, &group_id, &member_id, &amount);
    // Second payment must panic with AlreadyPaid
    client.mark_paid(&token_address, &group_id, &member_id, &amount);
}

#[test]
#[should_panic] // InvalidAmount
fn test_zero_amount_fails() {
    let env = Env::default();
    let contract_id = env.register(LumenGuildContract, ());
    let client = LumenGuildContractClient::new(&env, &contract_id);

    let group_id = String::from_str(&env, "g1");
    let title = String::from_str(&env, "Test Group");
    let desc = String::from_str(&env, "Test");
    let lead = Address::generate(&env);
    client.create_group(&group_id, &title, &desc, &lead);

    let member_id = String::from_str(&env, "m1");
    let member_addr = Address::generate(&env);
    client.add_member(&group_id, &member_id, &member_addr, &10u32);

    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_contract_id.address();

    env.mock_all_auths();
    // amount = 0 must panic with InvalidAmount
    client.mark_paid(&token_address, &group_id, &member_id, &0i128);
}
