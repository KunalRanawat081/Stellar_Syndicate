#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, panic_with_error, Env, Address, String, Vec, Symbol};

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

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    GroupAlreadyExists = 1,
    GroupNotFound = 2,
    MemberAlreadyExists = 3,
    MemberNotFound = 4,
    AlreadyPaid = 5,
}

#[contract]
pub struct LumenGuildContract;

#[contractimpl]
impl LumenGuildContract {
    // Initialize a new group
    pub fn create_group(env: Env, group_id: String, title: String, desc: String, lead: Address) {
        if env.storage().instance().has(&group_id) {
            panic_with_error!(&env, Error::GroupAlreadyExists);
        }
        let group = Group {
            id: group_id.clone(),
            title,
            description: desc,
            lead_buyer: lead.clone(),
        };
        env.storage().instance().set(&group_id, &group);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "create_group"), group_id),
            lead
        );
    }

    // Get group info
    pub fn get_group(env: Env, group_id: String) -> Group {
        if !env.storage().instance().has(&group_id) {
            panic_with_error!(&env, Error::GroupNotFound);
        }
        env.storage().instance().get(&group_id).unwrap()
    }

    // Add a member to a group
    pub fn add_member(env: Env, group_id: String, member_id: String, address: Address, order_amount: u32) {
        if !env.storage().instance().has(&group_id) {
            panic_with_error!(&env, Error::GroupNotFound);
        }
        let member_key = (group_id.clone(), member_id.clone());
        if env.storage().instance().has(&member_key) {
            panic_with_error!(&env, Error::MemberAlreadyExists);
        }
        let member = Member {
            id: member_id.clone(),
            address: address.clone(),
            order_amount,
            has_paid: false,
        };
        
        env.storage().instance().set(&member_key, &member);
        
        let mut members: Vec<String> = env.storage().instance().get(&(group_id.clone(), "members")).unwrap_or(Vec::new(&env));
        members.push_back(member_id.clone());
        env.storage().instance().set(&(group_id.clone(), "members"), &members);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "add_member"), group_id, member_id),
            (address, order_amount)
        );
    }

    // Mark a member as paid
    pub fn mark_paid(env: Env, token: Address, group_id: String, member_id: String) {
        let group = Self::get_group(env.clone(), group_id.clone());
        let member_key = (group_id.clone(), member_id.clone());
        if !env.storage().instance().has(&member_key) {
            panic_with_error!(&env, Error::MemberNotFound);
        }
        let mut member: Member = env.storage().instance().get(&member_key).unwrap();
        if member.has_paid {
            panic_with_error!(&env, Error::AlreadyPaid);
        }
        
        member.address.require_auth();
        
        // Execute token transfer from member.address to group.lead_buyer
        let amount = member.order_amount as i128;
        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&member.address, &group.lead_buyer, &amount);
        
        member.has_paid = true;
        
        env.storage().instance().set(&member_key, &member);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "mark_paid"), group_id, member_id),
            true
        );
    }
}

#[cfg(test)]
mod test;
