# Jira-Like Issue Tracking System — PostgreSQL Database Architecture

## 📌 Project Overview

This project focuses on designing the **database architecture of a Jira-like issue tracking system**.

Instead of building the application interface, the goal of this project is to implement a **production-grade PostgreSQL schema** that can support a modern multi-tenant project management platform.

The database structure models the core concepts used in real-world tools such as **Jira, Linear, or GitHub Issues**, including organizations, projects, issues, and role-based access control.

The system is designed with **security, scalability, and data isolation** in mind.

---

# 🧠 Core Concepts

The database models a hierarchical structure commonly used in SaaS project management systems.

```
Organization
     ↓
Projects
     ↓
Issues
```

Each layer introduces different access rules and relationships between users and resources.

Users can belong to organizations and receive different permission levels that control what they can view or modify.

---

# 🏢 Multi-Tenant Architecture

This system is designed as a **multi-tenant database**.

Multiple organizations can exist in the same database while remaining completely isolated from each other.

```
Organization A
   ├── Project 1
   ├── Project 2
   └── Issues

Organization B
   ├── Project X
   └── Issues
```

Data isolation is enforced using **PostgreSQL Row Level Security (RLS)**.

---

# 🔐 Access Control System

Access permissions are implemented using a **role-based authorization model**.

## Organization Roles

```
owner
admin
member
viewer
```

## Project Roles

```
project_admin
contributor
reviewer
viewer
```

## Issue Roles

```
contributor
reviewer
watcher
```

These roles determine what actions a user can perform within the system.

---

# 🛡 Row Level Security (RLS)

The database uses **PostgreSQL Row Level Security** to enforce access control directly at the database level.

This ensures that users can only access data they are authorized to see.

Example concept:

```
User → Organization Membership → Project Access → Issue Access
```

Security checks are implemented through **RLS policies and helper functions**.

---

# 🗂 Database Architecture

The database schema includes the following core entities:

```
users
organizations
organization_memberships

projects
project_memberships

issues
issue_memberships
```

Hierarchy:

```
organizations
     ↓
projects
     ↓
issues
```

Membership tables define user roles and permissions within each level.

---

# ⚙️ Technologies

This project focuses entirely on **database design and security architecture**.

Database

- PostgreSQL

Concepts Used

- Multi-tenant database design
- Role-based access control (RBAC)
- PostgreSQL Row Level Security (RLS)
- ENUM-based role systems
- Soft-delete patterns
- Helper authorization functions

---

# 📂 Project Structure

```
database/

├── enums/
├── tables/
├── functions/
│   ├── auth/
│   └── helper/
├── policies/
│   ├── organizations/
│   ├── projects/
│   └── issues/
└── migrations/
```

Explanation:

- **enums/** → role and status definitions  
- **tables/** → schema definitions  
- **functions/** → authorization helper functions  
- **policies/** → RLS policies  
- **migrations/** → database versioning  

---

# 🧩 Example Schema Design

Example relationship structure:

```
users
   ↓
organization_memberships
   ↓
organizations
   ↓
projects
   ↓
issues
```

This structure allows flexible permission management across multiple levels.

---

# 🎯 Project Goal

The goal of this project is to design a **secure, scalable PostgreSQL schema** capable of supporting a full-featured issue tracking system.

The focus is on:

- Data isolation
- Permission management
- Query performance
- Maintainable schema design

---

# 🧑‍💻 Author

Database architecture and design by **DemirCodes**.

---

⭐ If you find this database architecture useful, consider giving the repository a star.
