# Jira Database Architecture (PostgreSQL)

This repository contains the database architecture for a **Jira-like project management system** built with **PostgreSQL**.
The goal of this project is to design a **scalable, secure, and production-grade multi-tenant database system**.

## Overview

The database is designed with the following principles:

* **Multi-tenant architecture**
* **Role-based access control (RBAC)**
* **Row Level Security (RLS)**
* **Domain-based database structure**
* **Helper authorization functions**
* **Soft delete support**
* **Extensible SaaS-ready design**

This project focuses on **security, maintainability, and scalability**, similar to the database architecture used in large SaaS platforms.

---

# Core Concepts

## Multi-Tenant Design

The system supports multiple organizations where each organization can contain:

* Projects
* Issues
* Members
* Permissions

Each user can belong to multiple organizations and have different roles.

---

## Role Based Access Control

Permissions are managed through role hierarchies.

### Organization Roles

* `owner`
* `admin`
* `member`
* `viewer`

### Project Roles

* `project_admin`
* `contributor`
* `reviewer`
* `viewer`

### Issue Roles

* `contributor`
* `reviewer`
* `watcher`

---

## Row Level Security (RLS)

PostgreSQL **Row Level Security** is used to enforce access control at the database level.

Policies ensure that users can only access rows they are authorized to see.

Example policy usage:

* Organization membership validation
* Project access control
* Issue visibility restrictions

---

# Helper Authorization Functions

Authorization logic is centralized using helper functions.

Examples:

* `auth_current_user_id()`
* `auth_is_org_member()`
* `auth_is_org_admin()`
* `auth_is_project_admin()`
* `auth_is_project_contributor()`
* `auth_is_issue_contributor()`

These functions are used inside **RLS policies** to enforce access control.

---

# Project Structure

```
jira/
│
├── functions
│   ├── organization_helper_functions.sql
│   ├── project_helper_functions.sql
│   └── issue_helper_functions.sql
│
├── policies
│
├── schema
│
├── triggers
│
├── views
│
└── backup
```

---

# Technologies

* PostgreSQL
* SQL
* Row Level Security (RLS)
* Role Based Access Control (RBAC)

---

# Goals of This Project

This repository aims to demonstrate how to design a **secure and scalable database architecture for SaaS applications**, similar to systems used by modern project management tools.

Key goals include:

* Secure multi-tenant isolation
* Clean role-based permission models
* Maintainable database structure
* Production-ready authorization patterns

---

# Author

**DemirCodes**

GitHub:
https://github.com/DemirCodes

---

# License

This project is open-source and intended for educational and architectural reference purposes.

