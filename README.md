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
    git clone https://github.com/YourUsername/constraint-sql-builder.git
    cd constraint-sql-builder
    ```
2.  **Install dependencies:**
    ```bash
    npm install express js-yaml
    ```

---

## ⚙️ Usage

### From command line

Simply run
```bash
node app/constraint-sql-builder.js your_source_file.yaml your_generated_file.sql
```

### from html

Open local file docs/constraint-sql-builder-example-page.html from your pc (no internet connection is used).
Upload your configuration file and download sql generated.

### As git action

Define your data constraints in a YAML file and then run the Node.js script to generate the corresponding SQL.

See [Syntax Documentation](https://github.com/wolfsolver/constraint-sql-builder/wiki).

## Define Your Constraints (e.g., `constraints.yaml`)

Create a `constraints.yaml` file at the root of your project with your constraint definitions. You can use the YAML structure we discussed, including `definitions`, `anchors`, and `merge keys` for reusability.

```yaml
# Example: constraints.yaml
definitions:
  SAMPLE_TABLE1_pk: &SAMPLE_TABLE1_pk
    table: TABLE1
    pk: TABLE1PK
  SAMPLE_TABLE2_pk: &SAMPLE_TABLE2_pk
    table: TABLE2
    pk: TABLE2PK

validation_rules:
  - id: SAMPLE_TABLE1_FIELD1 NOT_NULL
    priority: 0    # 0 = higt     999999999999 = low
    severity: E
    source:
      table: TABLE1
      pk: TABLE1PK
      field: FIELD1
    check:
      operator: not null
    on_fail:
      message: "$source.field of $source.table is null"
```

## Full yaml example

Todo