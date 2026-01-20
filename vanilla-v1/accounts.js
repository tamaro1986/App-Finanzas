export class Account {
    constructor(id, name, type, color, initialBalance = 0, budget = 0) {
        this.id = id;
        this.name = name;
        this.type = type; // cash, debit, savings, etc.
        this.color = color;
        this.initialBalance = parseFloat(initialBalance);
        this.budget = parseFloat(budget);
    }
}

export class AccountManager {
    constructor() {
        this.accounts = [];
    }

    setAccounts(data) {
        // Hydrate plain objects into Account instances if needed
        this.accounts = data.map(a => new Account(a.id, a.name, a.type, a.color, a.initialBalance, a.budget));
    }

    addAccount(account) {
        this.accounts.push(account);
    }

    updateAccount(updatedAccount) {
        const index = this.accounts.findIndex(a => a.id === updatedAccount.id);
        if (index !== -1) {
            this.accounts[index] = updatedAccount;
        }
    }

    deleteAccount(id) {
        this.accounts = this.accounts.filter(a => a.id !== id);
    }

    getAccount(id) {
        return this.accounts.find(a => a.id === id);
    }

    getAll() {
        return this.accounts;
    }

    // Calculate dynamic balance based on transactions
    calculateBalance(accountId, transactions) {
        const account = this.getAccount(accountId);
        if (!account) return 0;

        let balance = account.initialBalance;

        transactions.forEach(t => {
            if (t.accountId === accountId) {
                if (t.type === 'income') balance += t.amount;
                if (t.type === 'expense') balance -= t.amount;
                if (t.type === 'transfer' && t.fromAccountId === accountId) balance -= t.amount; // Outgoing transfer
            }
            if (t.toAccountId === accountId && t.type === 'transfer') {
                balance += t.amount; // Incoming transfer
            }
        });

        return parseFloat(balance.toFixed(2));
    }
}
