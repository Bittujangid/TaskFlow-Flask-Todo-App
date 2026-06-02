# TaskFlow (Todo App)

A full-stack Task Management Web Application built using Flask and MySQL. Users can register, log in, create tasks, update task status, search and filter tasks, track progress, and manage their work through a modern responsive dashboard.

## Features

* User Registration and Login Authentication
* Session Management
* Create, Update, Delete, and Manage Tasks
* MySQL Database Integration
* SQLAlchemy ORM
* Search and Filter Tasks
* Progress Tracking Dashboard
* AJAX-based Dynamic Updates
* Toast Notifications
* Dark/Light Mode
* Responsive UI Design

## Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Python
* Flask
* SQLAlchemy

### Database

* MySQL

## Project Structure

```text
Todo_App/
│
├── app/
│   ├── routes/
│   ├── templates/
│   ├── static/
│   ├── models.py
│   └── __init__.py
│
├── run.py
├── .env.example
├── requirements.txt
└── README.md
```

## Installation

### 1. Clone Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_LINK
cd Todo_App
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

Windows:

```bash
venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Create MySQL Database

```sql
CREATE DATABASE todo_db;
```

### 6. Configure Environment Variables

Create a `.env` file and add:

```env
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/todo_db
SECRET_KEY=your_secret_key
```

### 7. Run Application

```bash
python run.py
```

Application will start at:

```text
http://127.0.0.1:5000
```

## Future Improvements

* Task Due Dates
* Email Notifications
* User Profile Management
* Deployment on Cloud

## Author

Bittu Jangid

Computer Science Engineering Student
