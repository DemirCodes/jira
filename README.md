# Jira-Like Multi-Tenant Issue Tracking Platform

## Project Overview

This project is an experimental Jira-like issue tracking system focused primarily on database architecture and scalable SaaS design.

The goal of this project is to design a production-grade PostgreSQL schema capable of supporting a modern issue tracking platform similar to Jira, Linear or GitHub Issues.

The system is designed as a multi-tenant SaaS architecture where multiple organizations can manage their own projects, sites and issues while sharing the same infrastructure.

At the moment the main focus of the project is the database architecture. Backend services and a web interface will be added later.

---

## Planned System Architecture

Due to budget limitations the system is implemented using containerized services instead of a large distributed infrastructure.

The system will run using three main containers.

System flow:

NGINX Reverse Proxy  
        │  
        │  
 ┌───────────────┬───────────────┬───────────────┐  
 │               │               │  
DATABASE       BACKEND         FRONTEND  
PostgreSQL     Node.js API     React App  
Container      Container       Container  

---

## Container Responsibilities

Database Container

PostgreSQL is responsible for:

- multi-tenant schema design
- role based authorization logic
- stored procedures
- triggers
- audit logging
- relational data integrity

Backend Container

The backend service will handle:

- API endpoints
- authentication
- authorization
- business logic
- database communication

Technologies planned:

- Node.js
- TypeScript

Frontend Container

The user interface will provide:

- organization management
- project dashboards
- issue tracking UI

Technologies planned:

- React.js
- HTML
- CSS

---

## Technology Stack

Backend

- Node.js
- TypeScript
- PostgreSQL

Frontend

- React.js
- HTML
- CSS

Infrastructure

- Docker
- Kubernetes
- NGINX
- Prometheus
- Grafana

---

## Core Concepts

The database models the hierarchical structure commonly used in SaaS project management platforms.

Organization  
↓  
Site  
↓  
Project  
↓  
Issue  

Each level introduces its own membership model and permission system.

Users can belong to multiple organizations and receive different permissions depending on their role.

---

## Multi-Tenant Architecture

The platform is designed as a multi-tenant SaaS system.

Multiple organizations share the same infrastructure while their data remains logically isolated.

Example structure:

Organization A  
 ├── Site 1  
 │   ├── Project A  
 │   └── Issues  
 └── Site 2  

Organization B  
 └── Project X  
     └── Issues  

Tenant isolation is enforced through:

- membership relationships
- authorization helper functions
- role validation triggers
- relational constraints

---

## Access Control Model

Permissions are implemented using a role-based authorization model.

Organization Roles

- owner
- admin
- member
- viewer

Site Roles

- admin
- contrubitor
- viewer

Project Roles

- project_admin
- contributor
- reviewer
- viewer

Issue Roles

- contributor
- reviewer
- watcher

Each role defines what actions a user can perform inside the system.

---

## Database Entities

The PostgreSQL schema includes the following core entities.

Users

Stores platform users and authentication data.

Organizations

Represents tenants within the platform.

Organization Memberships

Defines which users belong to an organization and their role.

Sites

Logical workspaces inside an organization.

Projects

Projects belong to sites and contain issues.

Issues

Issues represent tasks, bugs, stories or epics.

Issue Memberships

Defines issue level participation such as contributors or reviewers.

Assets

Files can be attached to:

- organizations
- sites
- projects
- issues

Audit Logs

The system records important actions in an audit log table.

---

## Database Features

The database architecture includes advanced PostgreSQL patterns such as:

- ENUM based role systems
- multi-tenant schema design
- role based access control
- trigger based permission validation
- helper authorization functions
- soft delete patterns
- audit logging

---

## Project Goal

The goal of this project is to design a secure and scalable PostgreSQL schema capable of supporting a full issue tracking platform.

The focus of this project includes:

- database security
- tenant isolation
- scalable schema design
- maintainable relational structure
- real-world SaaS database architecture

---

## Author

Database architecture and design by DemirCodes.

If you find this project useful consider giving the repository a star.
