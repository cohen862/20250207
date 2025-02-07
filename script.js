// 할일과 하지 말아야 할 일 목록을 저장할 배열
let tasks = {
    todo: JSON.parse(localStorage.getItem('todo-tasks')) || [],
    notTodo: JSON.parse(localStorage.getItem('not-todo-tasks')) || []
};

// 페이지 로드시 저장된 목록 불러오기
window.onload = function() {
    renderTasks();
};

// 할일 추가 함수
function addTask() {
    const input = document.getElementById('taskInput');
    const typeSelect = document.getElementById('taskType');
    const task = input.value.trim();
    const type = typeSelect.value;
    
    if (task) {
        const newTask = {
            id: Date.now(),
            text: task,
            completed: false
        };

        if (type === 'todo') {
            tasks.todo.push(newTask);
        } else {
            tasks.notTodo.push(newTask);
        }
        
        saveTasks();
        renderTasks();
        input.value = '';
    }
}

// 할일 삭제 함수
function deleteTask(id, type) {
    if (type === 'todo') {
        tasks.todo = tasks.todo.filter(task => task.id !== id);
    } else {
        tasks.notTodo = tasks.notTodo.filter(task => task.id !== id);
    }
    saveTasks();
    renderTasks();
}

// 할일 완료 상태 토글 함수
function toggleTask(id, type) {
    const taskList = type === 'todo' ? tasks.todo : tasks.notTodo;
    const updatedTasks = taskList.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });

    if (type === 'todo') {
        tasks.todo = updatedTasks;
    } else {
        tasks.notTodo = updatedTasks;
    }
    
    saveTasks();
    renderTasks();
}

// 할일 목록 저장 함수
function saveTasks() {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks.todo));
    localStorage.setItem('not-todo-tasks', JSON.stringify(tasks.notTodo));
}

// 할일 목록 렌더링 함수
function renderTasks() {
    const todoList = document.getElementById('todoList');
    const notTodoList = document.getElementById('notTodoList');
    
    todoList.innerHTML = '';
    notTodoList.innerHTML = '';
    
    // 할일 목록 렌더링
    tasks.todo.forEach(task => {
        const li = createTaskElement(task, 'todo');
        todoList.appendChild(li);
    });

    // 하지 말아야 할 일 목록 렌더링
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
        <span onclick="toggleTask(${task.id}, '${type}')" style="cursor: pointer">
            ${task.text}
        </span>
        <button onclick="deleteTask(${task.id}, '${type}')" class="delete-btn">삭제</button>
    `;
    
    return li;
}

// Enter 키로 할일 추가
document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});
