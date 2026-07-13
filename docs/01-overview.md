# Overview

## Project Description

**Vacuul Admin Dashboard** is a full-stack web application serving as the administrative management system for the Vacuul platform. It provides comprehensive tools for managing users, IoT machines, bookings, sessions, pricing, firmware updates, and content.

## Key Features

### User Management
- Create, read, update, and delete user accounts
- Assign roles to users
- Enable/disable user accounts
- View user session history
- Manage user profiles and photos

### Machine Management
- Register new IoT machines
- Configure machine settings (volume, brightness, timezone)
- Set machine schedules
- Assign content to machines (idle, pause, during-session videos)
- Monitor machine status (online/offline)
- Geolocation-based machine tracking

### Booking System
- View and manage session bookings
- Filter by date range and status
- Search bookings
- View treatment configurations
- Track session status (booked, started, completed, cancelled)

### Session Configuration
- Define treatment presets
- Configure frequency and temperature settings
- Manage LED color options
- Create reusable session templates

### Content Management
- Upload video and image content
- Manage content library
- Assign content to machines
- Track upload progress

### Firmware Updates (DFU)
- Upload firmware packages
- Manage firmware versions
- Track firmware deployment

### Pricing Management
- Create pricing plans
- Set session packages
- Configure currencies
- Manage savings/discounts

### Gift Cards
- Generate gift card codes
- Track gift card usage
- Manage redemptions

### Role-Based Access Control
- Define custom roles
- Set granular permissions per collection
- Assign roles to users
- Protect system roles

### System Monitoring
- View system logs
- Filter by severity
- Monitor machine errors
- Track contact form submissions

### Real-time Updates
- Live data synchronization via Firestore listeners
- Instant UI updates on data changes
- Real-time machine status monitoring

## Target Users

- **Administrators**: Full access to all features
- **Operators**: Machine and session management
- **Support Staff**: User management and support
- **Content Managers**: Content and firmware management

## Platform Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Firebase account access
