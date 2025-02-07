// 앱 네임스페이스 생성
const app = {
    db: firebase.firestore(),
    analytics: firebase.analytics(),
    tasks: {
        todo: [],
        notTodo: []
    },

    // 초기화
    init: function() {
        this.loadTasks();
        this.setupEventListeners();
        this.analytics.logEvent('page_view');
    },

    // 이벤트 리스너 설정
    setupEventListeners: function() {
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
    },

    // Firebase에서 데이터 불러오기
    loadTasks: async function() {
        try {
            const todoSnapshot = await this.db.collection('tasks')
                .doc('public')
                .collection('todo')
                .orderBy('createdAt', 'desc')
                .get();
                
            const notTodoSnapshot = await this.db.collection('tasks')
                .doc('public')
                .collection('notTodo')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.tasks.todo = todoSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.tasks.notTodo = notTodoSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderTasks();
        } catch (error) {
            console.error("Error loading tasks: ", error);
            this.analytics.logEvent('error_loading_tasks', {
                error_message: error.message
            });
        }
    },

    // 할일 추가
    addTask: async function() {
        const input = document.getElementById('taskInput');
        const typeSelect = document.getElementById('taskType');
        const task = input.value.trim();
        const type = typeSelect.value;
        
        if (task) {
            try {
                const newTask = {
                    text: task,
                    completed: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const collectionRef = this.db.collection('tasks')
                    .doc('public')
                    .collection(type === 'todo' ? 'todo' : 'notTodo');

                const docRef = await collectionRef.add(newTask);
                newTask.id = docRef.id;

                if (type === 'todo') {
                    this.tasks.todo.unshift(newTask);
                } else {
                    this.tasks.notTodo.unshift(newTask);
                }
                
                this.analytics.logEvent('task_added', {
                    task_type: type
                });
                
                this.renderTasks();
                input.value = '';
            } catch (error) {
                console.error("Error adding task: ", error);
                this.analytics.logEvent('error_adding_task', {
                    error_message: error.message
                });
            }
        }
    },

    // 할일 삭제
    deleteTask: async function(id, type) {
        try {
            await this.db.collection('tasks')
                .doc('public')
                .collection(type === 'todo' ? 'todo' : 'notTodo')
                .doc(id)
                .delete();

            if (type === 'todo') {
                this.tasks.todo = this.tasks.todo.filter(task => task.id !== id);
            } else {
                this.tasks.notTodo = this.tasks.notTodo.filter(task => task.id !== id);
            }

            this.analytics.logEvent('task_deleted', {
                task_type: type
            });

            this.renderTasks();
        } catch (error) {
            console.error("Error deleting task: ", error);
            this.analytics.logEvent('error_deleting_task', {
                error_message: error.message
            });
        }
    },

    // 할일 완료 상태 토글
    toggleTask: async function(id, type) {
        try {
            const taskList = type === 'todo' ? this.tasks.todo : this.tasks.notTodo;
            const task = taskList.find(t => t.id === id);
            const newStatus = !task.completed;

            await this.db.collection('tasks')
                .doc('public')
                .collection(type === 'todo' ? 'todo' : 'notTodo')
                .doc(id)
                .update({
                    completed: newStatus
                });

            task.completed = newStatus;

            this.analytics.logEvent('task_toggled', {
                task_type: type,
                new_status: newStatus
            });

            this.renderTasks();
        } catch (error) {
            console.error("Error toggling task: ", error);
            this.analytics.logEvent('error_toggling_task', {
                error_message: error.message
            });
        }
    },

    // 할일 목록 렌더링
    renderTasks: function() {
        const todoList = document.getElementById('todoList');
        const notTodoList = document.getElementById('notTodoList');
        
        todoList.innerHTML = '';
        notTodoList.innerHTML = '';
        
        this.tasks.todo.forEach(task => {
            const li = this.createTaskElement(task, 'todo');
            todoList.appendChild(li);
        });

        this.tasks.notTodo.forEach(task => {
            const li = this.createTaskElement(task, 'not-todo');
            notTodoList.appendChild(li);
        });
    },

    // 할일 항목 요소 생성
    createTaskElement: function(task, type) {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        
        li.innerHTML = `
            <span onclick="app.toggleTask('${task.id}', '${type}')" style="cursor: pointer">
                ${task.text}
            </span>
            <button onclick="app.deleteTask('${task.id}', '${type}')" class="delete-btn">삭제</button>
        `;
        
        return li;
    }
};

// 앱 초기화
window.onload = function() {
    app.init();
};
