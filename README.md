# IUDX- POLICY BASED CONSENT SERVICE ARCHITECTURE

API Documentation link:
https://app.swaggerhub.com/apis/CHITNISKANIKA/Locker/1.0.0#/

Managing data sharing in compliance with regulations and obtaining consent from data owners can be complex.  To address this, we are developing a web application specifically designed to streamline the consent management process, ensuring that data sharing is both open-ended and compliant.​

## Features
#### User Functionality
- Locker Creation: Users can create lockers to upload and organise resources.
- Resource Sharing: Share resources with others through connections.

#### Administrative Functions
- Freezing Lockers: System administrators and moderators can freeze lockers.
- Global Connections: System administrators can create global connections.

#### Locker Management
- Resource Organization: Lockers serve as primary storage for user content.
- Collaborative Management: Connections between lockers enable collaborative sharing and resource management.

#### Connections
- User Connections: Establish links between users through connections.
- Locker Connections: Connections link the lockers of different users.

#### Connection Types
- Diverse Interactions: Define various connection types (e.g., BTech, MTech, staff admissions) with specific attributes and rules.
- Categorization: Helps categorise and manage connections based on purpose and requirements.

#### Connection Terms
- Customizable Terms: Define terms for connection types, specifying rules and conditions.
- Governance and Control: Tailor connections to specific needs, ensuring proper governance over shared resources.

## Prerequisites
- Python 3.x
- Django 5.0.6
- Django REST framework
- Django REST framework authtoken
- SQLite (or another database, if configured)
- Node.js and npm (for the frontend)

## Steps to Run

### Backend Setup

1. #### Clone the repository:
   git clone https://github.com/WSL-IIITB/DPI-Primitive.git
   cd DPI-Primitive/
2. Check out the ‘backend’ branch:
3. Navigate to the backend directory and install dependencies:
4. Make Migrations:
5. #### Run the Development Server:
   


