from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from app import db
from app.models import Task
from app.routes.auth import login_required
from functools import wraps

tasks_bp = Blueprint('tasks', __name__)

# AJAX helper decorator to check session status and return 401 if missing
def login_required_ajax(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Helper function to compute user task statistics
def get_user_stats(user_id):
    total = Task.query.filter_by(user_id=user_id).count()
    pending = Task.query.filter_by(user_id=user_id, status='Pending').count()
    working = Task.query.filter_by(user_id=user_id, status='Working').count()
    done = Task.query.filter_by(user_id=user_id, status='Done').count()
    return {
        'total': total,
        'pending': pending,
        'working': working,
        'done': done
    }

@tasks_bp.route("/")
@login_required
def view_tasks():
    user_id = session['user_id']
    tasks = Task.query.filter_by(user_id=user_id).all()
    stats = get_user_stats(user_id)
    return render_template('task.html', tasks=tasks, stats=stats)

# AJAX Add Task
@tasks_bp.route("/add", methods=["POST"])
@login_required_ajax
def add_tasks():
    user_id = session['user_id']
    
    # Extract details supporting both JSON and Form headers
    if request.is_json:
        data = request.get_json()
        title = data.get('title', '').strip()
        priority = data.get('priority', 'Medium')
    else:
        title = request.form.get('title', '').strip()
        priority = request.form.get('priority', 'Medium')

    if not title:
        return jsonify({'error': 'Task title is required'}), 400

    if priority not in ['High', 'Medium', 'Low']:
        priority = 'Medium'

    new_task = Task(title=title, status='Pending', priority=priority, user_id=user_id)
    
    try:
        db.session.add(new_task)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Task added successfully!',
            'task': {
                'id': new_task.id,
                'title': new_task.title,
                'status': new_task.status,
                'priority': new_task.priority
            },
            'stats': get_user_stats(user_id)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add task'}), 500

# AJAX Toggle Status (Pending -> Working -> Done -> Pending)
@tasks_bp.route("/toggle/<int:task_id>", methods=["POST"])
@login_required_ajax
def toggle_status(task_id):
    user_id = session['user_id']
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    
    if not task:
        return jsonify({'error': 'Task not found or unauthorized'}), 404

    # Status Workflow: Pending -> Working -> Done -> Pending
    if task.status == 'Pending':
        task.status = 'Working'
    elif task.status == 'Working':
        task.status = 'Done'
    else:
        task.status = 'Pending'

    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Status updated successfully!',
            'task': {
                'id': task.id,
                'title': task.title,
                'status': task.status,
                'priority': task.priority
            },
            'stats': get_user_stats(user_id)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update status'}), 500

# AJAX Delete Task
@tasks_bp.route("/delete/<int:task_id>", methods=["POST", "DELETE"])
@login_required_ajax
def delete_task(task_id):
    user_id = session['user_id']
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    
    if not task:
        return jsonify({'error': 'Task not found or unauthorized'}), 404

    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Task deleted successfully!',
            'stats': get_user_stats(user_id)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete task'}), 500

# AJAX Clear All Tasks
@tasks_bp.route("/clear", methods=["POST"])
@login_required_ajax
def clear_tasks():
    user_id = session['user_id']
    try:
        Task.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'All tasks cleared successfully!',
            'stats': get_user_stats(user_id)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to clear workspace'}), 500

# AJAX Get Stats
@tasks_bp.route("/stats", methods=["GET"])
@login_required_ajax
def get_stats():
    user_id = session['user_id']
    return jsonify(get_user_stats(user_id))