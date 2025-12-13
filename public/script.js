document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const statusMessage = document.getElementById('status-message');

    // !!! GANTI DENGAN ALAMAT IP PUBLIK EC2 ANDA !!!
    const API_HOST = 'http://ec2-18-136-101-62.ap-southeast-1.compute.amazonaws.com:80'; 
    
    statusMessage.textContent = 'Loading...';

    // --- Fungsi Utilitas DOM ---
    function addTaskToDOM(task) {
        const listItem = document.createElement('li');
        listItem.dataset.id = task.id; 
        listItem.classList.toggle('completed', task.is_completed);

        const taskText = document.createElement('span');
        taskText.textContent = task.title;
        // Klik pada teks untuk toggle status selesai/belum
        taskText.addEventListener('click', () => toggleTaskCompletion(task.id, !task.is_completed));

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Hapus';
        deleteButton.addEventListener('click', () => deleteTask(task.id));

        listItem.appendChild(taskText);
        listItem.appendChild(deleteButton);
        todoList.appendChild(listItem);
    }

    // --- Fungsi Interaksi API ---

    // 1. Ambil semua tugas
    async function fetchTodos() {
        try {
            const response = await fetch(`${API_HOST}/tasks`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tasks = await response.json();
            todoList.innerHTML = '';
            statusMessage.textContent = '';
            tasks.forEach(task => addTaskToDOM(task));
        } catch (error) {
            console.error('Gagal mengambil tugas:', error);
            statusMessage.textContent = 'Gagal terhubung ke API. Cek server deployment Anda.';
            todoList.innerHTML = '';
        }
    }

    // 2. Tambah tugas baru
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();
        if (!title) return;

        try {
            const response = await fetch(`${API_HOST}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });
            const newTask = await response.json();
            addTaskToDOM(newTask);
            todoInput.value = '';
        } catch (error) {
            console.error('Gagal menambahkan tugas:', error);
            statusMessage.textContent = 'Gagal menambahkan tugas. Coba lagi.';
        }
    });

    // 3. Toggle status selesai
    async function toggleTaskCompletion(id, isCompleted) {
        try {
            const response = await fetch(`${API_HOST}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_completed: isCompleted }),
            });
            const updatedTask = await response.json();
            const listItem = todoList.querySelector(`[data-id="${id}"]`);
            if (listItem) {
                listItem.classList.toggle('completed', updatedTask.is_completed);
            }
        } catch (error) {
            console.error('Gagal mengubah status tugas:', error);
        }
    }

    // 4. Hapus tugas
    async function deleteTask(id) {
        try {
            await fetch(`${API_HOST}/tasks/${id}`, {
                method: 'DELETE',
            });
            const listItem = todoList.querySelector(`[data-id="${id}"]`);
            if (listItem) {
                listItem.remove();
            }
        } catch (error) {
            console.error('Gagal menghapus tugas:', error);
        }
    }

    // Panggil saat halaman dimuat
    fetchTodos();
});
