#![cfg(test)]

use super::*;
use soroban_sdk::{Env, Address, String};

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
    let order_amount = 50;

    // Test adding member
    client.add_member(&group_id, &member_id, &member_addr, &order_amount);

    // Test mark paid
    env.mock_all_auths();
    client.mark_paid(&group_id, &member_id);
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
