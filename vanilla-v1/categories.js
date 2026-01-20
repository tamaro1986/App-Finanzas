export class CategoryManager {
    constructor() {
        this.categories = {
            income: [],
            expense: []
        };
    }

    // Load defaults if empty
    loadFromConfig(defaultConfig) {
        if (this.categories.income.length === 0 && this.categories.expense.length === 0) {
            this.categories = JSON.parse(JSON.stringify(defaultConfig)); // Deep copy
        }
    }

    // Set categories directly (e.g. from storage)
    setCategories(data) {
        if (data) this.categories = data;
    }

    getCategories(type) {
        return this.categories[type] || [];
    }

    getAll() {
        return [...this.categories.income, ...this.categories.expense];
    }

    getCategory(id) {
        const all = [...this.categories.income, ...this.categories.expense];
        return all.find(c => c.id === id);
    }

    addCategory(type, category) {
        if (this.categories[type]) {
            this.categories[type].push(category);
            return true;
        }
        return false;
    }

    updateCategory(updatedCategory) {
        // Try to find and update in income
        let index = this.categories.income.findIndex(c => c.id === updatedCategory.id);
        if (index !== -1) {
            this.categories.income[index] = updatedCategory;
            return true;
        }
        // Try to find and update in expense
        index = this.categories.expense.findIndex(c => c.id === updatedCategory.id);
        if (index !== -1) {
            this.categories.expense[index] = updatedCategory;
            return true;
        }
        return false;
    }

    deleteCategory(id) {
        this.categories.income = this.categories.income.filter(c => c.id !== id);
        this.categories.expense = this.categories.expense.filter(c => c.id !== id);
    }
}
