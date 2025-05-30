# Constraint SQL Builder

A Node.js tool designed to automate the generation of SQL `SELECT` statements. It leverages declarative YAML files to define data constraints, transforming them into executable SQL queries with appropriate `JOIN` and `WHERE` clauses. This project is ideal for maintaining data quality checks, audit trails, and reporting tasks.

> [!CAUTION]
> This repo is a working progress.
> No package is released

---

## 🚀 Getting Started

Read [ReadMe](https://github.com/wolfsolver/constraint-sql-builder/blob/main/README.md) on github.

## ⚙️ Usage

### From command line

Simply run
```bash
node app/constraint-sql-builder-cli.js your_source_file.yaml your_generated_file.sql
```
or

try our our [Live Demo](constraint-sql-builder-web.html)


### As git action

Define your data constraints in a YAML file and then run the Node.js script to generate the corresponding SQL.

See our action [here](https://github.com/wolfsolver/constraint-sql-builder/blob/main/.github/workflows/generate_sql.yml)

## Define Your Constraints (e.g., `constraints.yaml`)

Create a `constraints.yaml` file at the root of your project with your constraint definitions. You can use the YAML structure we discussed, including `definitions`, `anchors`, and `merge keys` for reusability.

```yaml
# Definition: constraints.yaml
setting:
  separator: union  # valid or ;
  add_row_id: false # default true show rowcounter

validation_rules:
  - id:                               # optional, id of rule
    severity:                         # optional I, W, E
    source:                           # mandatory
      table:                          # mandatory table
      pk:                             # optional primary key of table
      field:                          # optional field to check
      joinfield:                      # optional field for join, joinField || field || pk || null
    fk:                               # optional table join
      table:                          # mandatory if fk: is define, table for join
      pk:                             # optional primary key for right table
      joinfield:                      # optional field for join, if not present pk is used
      field:                          # optional field to show in result = field || joinfield || pk || null
    where:                            # optional additional where condition
    check:                            # optional, if not present is check.value = is null
      sql:                            # optional sql for where
      value:                          # optional used to build ${( fk.field || fk.joinField || fk.pk || surce.field || source.pk )} ${check.value}
    on_success:                       # optional error if generated where is true
      message:                        # optional error message. valid ${struct.field} for name and (${struct.field}) for its content
    on_fail:                          # optional error if generated where is false. cannot be present with on_fail
      message:                        # optional error message. valid ${struct.field} for name and (${struct.field}) for its content
    fix:                              # optional build fix. Place here your SQL code with (${source.pk}) to identify correct record or use
      update:                         # optional sql for update. put here value for source.field
      delete:                         # optional if present build delete statement for (${source.pk})

```

### Full yaml example
See this [example](https://github.com/wolfsolver/constraint-sql-builder/blob/main/samples/check_mmex_db.yaml)