#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Group {
    pub id: String,
    pub title: String,
    pub description: String,
    pub lead_buyer: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Member {
    pub id: String,
    pub address: Address,
    pub order_amount: u32,
    pub has_paid: bool,
}

#[contract]
pub struct LumenGuildContract;

#[contractimpl]
impl LumenGuildContract {
    // Initialize a new group
    pub fn create_group(env: Env, group_id: String, title: String, desc: String, lead: Address) {
        let group = Group {
            id: group_id.clone(),
            title,
            description: desc,
            lead_buyer: lead,
        };
        env.storage().instance().set(&group_id, &group);
    }

    // Get group info
    pub fn get_group(env: Env, group_id: String) -> Group {
        env.storage().instance().get(&group_id).unwrap()
    }

    // Add a member to a group
    pub fn add_member(env: Env, group_id: String, member_id: String, address: Address, order_amount: u32) {
        let member = Member {
            id: member_id.clone(),
            address,
            order_amount,
            has_paid: false,
        };
        
        let member_key = (group_id.clone(), member_id.clone());
        env.storage().instance().set(&member_key, &member);
        
        let mut members: Vec<String> = env.storage().instance().get(&(group_id.clone(), "members")).unwrap_or(Vec::new(&env));
        members.push_back(member_id);
        env.storage().instance().set(&(group_id, "members"), &members);
    }

    // Mark a member as paid
    pub fn mark_paid(env: Env, group_id: String, member_id: String) {
        let member_key = (group_id, member_id);
        let mut member: Member = env.storage().instance().get(&member_key).unwrap();
        
        member.address.require_auth();
        member.has_paid = true;
        
        env.storage().instance().set(&member_key, &member);
    }
}
