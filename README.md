# EcoFleet APU Mobile App

A comprehensive mobile application for EcoFleet APU control and management, featuring:

## Features

- **APU Control**: Start, stop, system status and maintenance information for paid users
- **Dealer Finder**: Locate service, sales and support dealers
- **Downloads**: Access to updates and manuals
- **Support FAQ**: Comprehensive support documentation
- **Contact Section**: Email and support request functionality
- **Forum Access**: Community discussion platform
- **Service History**: Customer service and sales history tracking
- **Social Media Integration**: Connect with EcoFleet social platforms
- **Photo Album**: User photo uploads with review/approval system for public testimonials
- **Web GUI**: Complete web interface for all features

## Technology Stack

- **Backend**: FastAPI with Python
- **Frontend**: React with TypeScript and Tailwind CSS
- **Mobile**: Progressive Web App (PWA) for cross-platform compatibility
- **Database**: In-memory database for proof of concept
- **Authentication**: JWT-based user authentication

## Project Structure

```
/
├── backend/          # FastAPI backend application
├── frontend/         # React frontend application
├── mobile/           # Mobile-specific configurations
└── docs/            # Documentation
```

## Development

See individual README files in backend/ and frontend/ directories for setup instructions.

## Deployment

The application is designed to be deployed with:
- Backend on Fly.io
- Frontend as static site deployment
- Mobile app as PWA installable on iOS and Android

## Reference

Based on HP2000 APU product line: https://www.hp2000apu.com/
