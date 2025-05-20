# Constraint SQL Builder

A Node.js tool designed to automate the generation of SQL `SELECT` statements. It leverages declarative YAML files to define data constraints, transforming them into executable SQL queries with appropriate `JOIN` and `WHERE` clauses. This project is ideal for maintaining data quality checks, audit trails, and reporting tasks.

> [!CAUTION]
> This repo is a working progress.
> No package is released

---

## 🚀 Getting Started

Follow these steps to get your `constraint-sql-builder` up and running.

### Prerequisites

* Node.js (LTS version recommended)
* npm (Node Package Manager)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YourUsername/constraint-sql-builder.git](https://github.com/YourUsername/constraint-sql-builder.git)
    cd constraint-sql-builder
    ```
2.  **Install dependencies:**
    ```bash
    npm install js-yaml
    ```

---

## ⚙️ Usage

Define your data constraints in a YAML file and then run the Node.js script to generate the corresponding SQL.

### 1. Define Your Constraints (e.g., `constraints.yaml`)

Create a `constraints.yaml` file at the root of your project with your constraint definitions. You can use the YAML structure we discussed, including `definitions`, `anchors`, and `merge keys` for reusability.

```yaml
# Example: constraints.yaml
constraints:
  - severity: E
    description: "Transaction date before account initial date"
    left:
      table: CHECKINGACCOUNT_V1
      primary_key: TRANSID
      foreign_key: ACCOUNTID
      field: TRANSDATE
    operator: "<"
    right:
      table: ACCOUNTLIST_V1
      primary_key: ACCOUNTID
      field: INITIALDATE
    condition: "( DELETEDTIME is null OR DELETEDTIME = '' )"
    comment: "INITIALDATE\ttransaction date before account initial date"
  # Add more constraints here

definitions:
  primary_keys:
    CHECKINGACCOUNT_V1: TRANSID
    ACCOUNTLIST_V1: ACCOUNTID
    CUSTOMER_V2: CUSTID
    # ... other primary keys ...

  left_checking_account_transdate: &left_checking_account_transdate
    table: CHECKINGACCOUNT_V1
    primary_key: *definitions.primary_keys.CHECKINGACCOUNT_V1
    foreign_key: ACCOUNTID
    field: TRANSDATE
