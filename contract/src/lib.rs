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
    InvalidAmount = 6,
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

    // Get all member IDs registered in a group
    pub fn get_members(env: Env, group_id: String) -> Vec<String> {
        if !env.storage().instance().has(&group_id) {
            panic_with_error!(&env, Error::GroupNotFound);
        }
        env.storage().instance()
            .get(&(group_id, "members"))
            .unwrap_or(Vec::new(&env))
    }

    // Get a single member's state (for hydrating hasPaid status)
    pub fn get_member(env: Env, group_id: String, member_id: String) -> Member {
        let member_key = (group_id, member_id);
        if !env.storage().instance().has(&member_key) {
            panic_with_error!(&env, Error::MemberNotFound);
        }
        env.storage().instance().get(&member_key).unwrap()
    }

    // Mark a member as paid.
    //
    // FIX: The `amount` parameter now carries the exact financial cost in the
    // SAC token's base units (stroops for XLM), calculated by the frontend's
    // settlement engine. This replaces the previous broken behaviour of using
    // `member.order_amount` (item quantity, not a monetary value) as the
    // transfer amount, and removes the redundant off-chain Horizon payment step.
    //
    // The contract now owns the entire payment flow atomically:
    //   1. Verifies the group and member exist.
    //   2. Requires auth from member.address.
    //   3. Calls token.transfer to move `amount` stroops from member to lead_buyer.
    //   4. Persists has_paid = true on-chain.
    pub fn mark_paid(env: Env, token: Address, group_id: String, member_id: String, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }

        let group = Self::get_group(env.clone(), group_id.clone());
        let member_key = (group_id.clone(), member_id.clone());
        if !env.storage().instance().has(&member_key) {
            panic_with_error!(&env, Error::MemberNotFound);
        }
        let mut member: Member = env.storage().instance().get(&member_key).unwrap();
        if member.has_paid {
            panic_with_error!(&env, Error::AlreadyPaid);
        }
        
        // Require the member to authorise this call — they must sign the transaction
        member.address.require_auth();

        // Execute the token transfer from the member's address to the lead buyer
        // using the financially correct `amount` passed in from the settlement engine.
        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&member.address, &group.lead_buyer, &amount);
        
        member.has_paid = true;
        env.storage().instance().set(&member_key, &member);

        // Publish event
        env.events().publish(
            (Symbol::new(&env, "mark_paid"), group_id, member_id),
            amount
        );
    }
}

#[cfg(test)]
mod test;
