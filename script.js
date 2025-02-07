let tasks = {
    todo: [],
    notTodo: []
};

// 페이지 로드시 데이터 불러오기
window.onload = function() {
    loadTasks();
    // 페이지 방문 이벤트 기록
    window.analytics.logEvent('page_view');
};

// Firebase에서 데이터 불러오기
async function loadTasks() {
    try {
        const todoSnapshot = await window.db.collection('tasks')
            .doc('public')
            .collection('todo')
            .orderBy('createdAt', 'desc')
            .get();
            
        const notTodoSnapshot = await window.db.collection('tasks')
            .doc('public')
            .collection('notTodo')
            .orderBy('createdAt', 'desc')
            .get();
        
        tasks.todo = todoSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        tasks.notTodo = notTodoSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderTasks();
    } catch (error) {
        console.error("Error loading tasks: ", error);
        window.analytics.logEvent('error_loading_tasks', {
            error_message: error.message
        });
    }
}

// 할일 추가 함수
async function addTask() {
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

            const collectionRef = window.db.collection('tasks')
                .doc('public')
                .collection(type === 'todo' ? 'todo' : 'notTodo');

            const docRef = await collectionRef.add(newTask);
            newTask.id = docRef.id;

            if (type === 'todo') {
                tasks.todo.unshift(newTask);
            } else {
                tasks.notTodo.unshift(newTask);
            }
            
            // 할일 추가 이벤트 기록
            window.analytics.logEvent('task_added', {
                task_type: type
            });
            
            renderTasks();
            input.value = '';
        } catch (error) {
            console.error("Error adding task: ", error);
            window.analytics.logEvent('error_adding_task', {
                error_message: error.message
            });
        }
    }
}

// 할일 삭제 함수
async function deleteTask(id, type) {
    try {
        await window.db.collection('tasks')
            .doc('public')
            .collection(type === 'todo' ? 'todo' : 'notTodo')
            .doc(id)
            .delete();

        if (type === 'todo') {
            tasks.todo = tasks.todo.filter(task => task.id !== id);
        } else {
            tasks.notTodo = tasks.notTodo.filter(task => task.id !== id);
        }

        // 할일 삭제 이벤트 기록
        window.analytics.logEvent('task_deleted', {
            task_type: type
        });

        renderTasks();
    } catch (error) {
        console.error("Error deleting task: ", error);
        window.analytics.logEvent('error_deleting_task', {
            error_message: error.message
        });
    }
}

// 할일 완료 상태 토글 함수
async function toggleTask(id, type) {
    try {
        const taskList = type === 'todo' ? tasks.todo : tasks.notTodo;
        const task = taskList.find(t => t.id === id);
        const newStatus = !task.completed;

        await window.db.collection('tasks')
            .doc('public')
            .collection(type === 'todo' ? 'todo' : 'notTodo')
            .doc(id)
            .update({
                completed: newStatus
            });

        task.completed = newStatus;

        // 할일 상태 변경 이벤트 기록
        window.analytics.logEvent('task_toggled', {
            task_type: type,
            new_status: newStatus
        });

        renderTasks();
    } catch (error) {
        console.error("Error toggling task: ", error);
        window.analytics.logEvent('error_toggling_task', {
            error_message: error.message
        });
    }
}

// 할일 목록 렌더링 함수
function renderTasks() {
    const todoList = document.getElementById('todoList');
    const notTodoList = document.getElementById('notTodoList');
    
    todoList.innerHTML = '';
    notTodoList.innerHTML = '';
    
    tasks.todo.forEach(task => {
        const li = createTaskElement(task, 'todo');
        todoList.appendChild(li);
    });

    tasks.notTodo.forEach(task => {
        const li = createTaskElement(task, 'not-todo');
        notTodoList.appendChild(li);
    });
}

// 할일 항목 요소 생성 함수
function createTaskElement(task, type) {
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    
    li.innerHTML = `
        <span onclick="toggleTask('${task.id}', '${type}')" style="cursor: pointer">
            ${task.text}
        </span>
        <button onclick="deleteTask('${task.id}', '${type}')" class="delete-btn">삭제</button>
    `;
    
    return li;
}

// Enter 키로 할일 추가
document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});
