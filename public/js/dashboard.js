// Global variables
let salesData = [];
let monthlyMeta = 15000;
let lineChart, pieChart, barChart;

// Account mapping
const accountMap = {
    '@lolamodas.ia': 'lola_modas',
    '@laladaroca': 'lala_daroca',
    '@dudamodas05': 'duda_modas',
    '@judourado.shop': 'ju_dourado',
    '@mariadourado.shop': 'maria_dourado'
};

const accountMapReverse = {
    'lola_modas': '@lolamodas.ia',
    'lala_daroca': '@laladaroca',
    'duda_modas': '@dudamodas05',
    'ju_dourado': '@judourado.shop',
    'maria_dourado': '@mariadourado.shop'
};

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadData();
    await loadMeta();
    setTodayDate();
    updateDashboard();
    renderTable();
});

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/';
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Load data from API
async function loadData() {
    try {
        const response = await fetch('/api/sales');
        salesData = await response.json();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('dashboard', 'error', 'Erro ao carregar dados');
    }
}

// Load meta from API
async function loadMeta() {
    try {
        const response = await fetch('/api/settings/meta');
        const data = await response.json();
        monthlyMeta = data.meta;
    } catch (error) {
        console.error('Erro ao carregar meta:', error);
    }
}

// Set today's date in form
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inputDate').value = today;
    document.getElementById('customEndDate').value = today;
}

// Switch tabs
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.closest('.tab').classList.add('active');
    document.getElementById(tab).classList.add('active');
    
    if (tab === 'dashboard') {
        updateDashboard();
    }
}

// Toggle custom date inputs
function toggleCustomDates() {
    const period = document.getElementById('filterPeriod').value;
    const showCustom = period === 'custom';
    document.getElementById('customStartGroup').style.display = showCustom ? 'block' : 'none';
    document.getElementById('customEndGroup').style.display = showCustom ? 'block' : 'none';
    
    if (!showCustom) {
        applyFilters();
    }
}

// Save data
async function saveData(event) {
    event.preventDefault();
    
    const date = document.getElementById('inputDate').value;
    const lola = parseFloat(document.getElementById('inputLola').value);
    const lala = parseFloat(document.getElementById('inputLala').value);
    const duda = parseFloat(document.getElementById('inputDuda').value);
    const ju = parseFloat(document.getElementById('inputJu').value);
    const maria = parseFloat(document.getElementById('inputMaria').value);
    
    try {
        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date,
                lola_modas: lola,
                lala_daroca: lala,
                duda_modas: duda,
                ju_dourado: ju,
                maria_dourado: maria
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            await loadData();
            resetForm();
            renderTable();
            showAlert('manage', 'success', 'Registro adicionado com sucesso!');
        } else {
            showAlert('manage', 'error', data.error || 'Erro ao adicionar registro');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showAlert('manage', 'error', 'Erro ao salvar registro');
    }
}

// Reset form
function resetForm() {
    document.getElementById('dataForm').reset();
    setTodayDate();
}

// Render table
function renderTable() {
    const container = document.getElementById('tableContent');
    
    if (salesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhum registro encontrado</h3>
                <p>Adicione seu primeiro registro acima</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>@lolamodas.ia</th>
                    <th>@laladaroca</th>
                    <th>@dudamodas05</th>
                    <th>@judourado.shop</th>
                    <th>@mariadourado.shop</th>
                    <th>Total</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    salesData.slice().reverse().forEach((data) => {
        const total = parseFloat(data.lola_modas) + parseFloat(data.lala_daroca) + 
                     parseFloat(data.duda_modas) + parseFloat(data.ju_dourado) + 
                     parseFloat(data.maria_dourado);
        html += `
            <tr>
                <td>${formatDate(data.date)}</td>
                <td>${formatCurrency(data.lola_modas)}</td>
                <td>${formatCurrency(data.lala_daroca)}</td>
                <td>${formatCurrency(data.duda_modas)}</td>
                <td>${formatCurrency(data.ju_dourado)}</td>
                <td>${formatCurrency(data.maria_dourado)}</td>
                <td><strong>${formatCurrency(total)}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-edit" onclick="openEditModal(${data.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-delete" onclick="deleteData(${data.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Open edit modal
function openEditModal(id) {
    const data = salesData.find(d => d.id === id);
    
    document.getElementById('editId').value = id;
    document.getElementById('editDate').value = data.date;
    document.getElementById('editLola').value = data.lola_modas;
    document.getElementById('editLala').value = data.lala_daroca;
    document.getElementById('editDuda').value = data.duda_modas;
    document.getElementById('editJu').value = data.ju_dourado;
    document.getElementById('editMaria').value = data.maria_dourado;
    
    document.getElementById('editModal').classList.add('active');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Update data
async function updateData(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
    const date = document.getElementById('editDate').value;
    const lola = parseFloat(document.getElementById('editLola').value);
    const lala = parseFloat(document.getElementById('editLala').value);
    const duda = parseFloat(document.getElementById('editDuda').value);
    const ju = parseFloat(document.getElementById('editJu').value);
    const maria = parseFloat(document.getElementById('editMaria').value);
    
    try {
        const response = await fetch(`/api/sales/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date,
                lola_modas: lola,
                lala_daroca: lala,
                duda_modas: duda,
                ju_dourado: ju,
                maria_dourado: maria
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            await loadData();
            closeEditModal();
            renderTable();
            showAlert('manage', 'success', 'Registro atualizado com sucesso!');
        } else {
            showAlert('manage', 'error', data.error || 'Erro ao atualizar registro');
        }
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        showAlert('manage', 'error', 'Erro ao atualizar registro');
    }
}

// Delete data
async function deleteData(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    
    try {
        const response = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            await loadData();
            renderTable();
            showAlert('manage', 'success', 'Registro excluído com sucesso!');
        } else {
            const data = await response.json();
            showAlert('manage', 'error', data.error || 'Erro ao excluir registro');
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showAlert('manage', 'error', 'Erro ao excluir registro');
    }
}

// Edit meta
function editMeta() {
    document.getElementById('metaValue').value = monthlyMeta;
    document.getElementById('metaModal').classList.add('active');
}

// Close meta modal
function closeMetaModal() {
    document.getElementById('metaModal').classList.remove('active');
}

// Update meta
async function updateMeta(event) {
    event.preventDefault();
    
    const meta = parseFloat(document.getElementById('metaValue').value);
    
    try {
        const response = await fetch('/api/settings/meta', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meta })
        });
        
        if (response.ok) {
            monthlyMeta = meta;
            closeMetaModal();
            updateDashboard();
            showAlert('dashboard', 'success', 'Meta atualizada com sucesso!');
        } else {
            showAlert('dashboard', 'error', 'Erro ao atualizar meta');
        }
    } catch (error) {
        console.error('Erro ao atualizar meta:', error);
        showAlert('dashboard', 'error', 'Erro ao atualizar meta');
    }
}

// Apply filters and update dashboard
function applyFilters() {
    updateDashboard();
}

// Get filtered data
function getFilteredData() {
    let filtered = [...salesData];
    
    const account = document.getElementById('filterAccount').value;
    const period = document.getElementById('filterPeriod').value;
    const now = new Date();
    
    if (period === 'daily') {
        const today = now.toISOString().split('T')[0];
        filtered = filtered.filter(d => d.date === today);
    } else if (period === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(d => new Date(d.date) >= weekAgo);
    } else if (period === 'monthly') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(d => new Date(d.date) >= monthAgo);
    } else if (period === 'custom') {
        const startDate = document.getElementById('customStartDate').value;
        const endDate = document.getElementById('customEndDate').value;
        if (startDate && endDate) {
            filtered = filtered.filter(d => d.date >= startDate && d.date <= endDate);
        }
    }
    
    return { filtered, account };
}

// Render fixed cards
function renderFixedCards() {
    const container = document.getElementById('fixedCards');
    
    if (salesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-inbox"></i>
                <h3>Nenhum dado registrado ainda</h3>
                <p>Adicione registros para visualizar as métricas</p>
            </div>
        `;
        return;
    }
    
    let totalRevenue = 0;
    salesData.forEach(data => {
        totalRevenue += parseFloat(data.lola_modas) + parseFloat(data.lala_daroca) + 
                       parseFloat(data.duda_modas) + parseFloat(data.ju_dourado) + 
                       parseFloat(data.maria_dourado);
    });
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let last7DaysRevenue = 0;
    salesData.forEach(data => {
        if (new Date(data.date) >= sevenDaysAgo) {
            last7DaysRevenue += parseFloat(data.lola_modas) + parseFloat(data.lala_daroca) + 
                               parseFloat(data.duda_modas) + parseFloat(data.ju_dourado) + 
                               parseFloat(data.maria_dourado);
        }
    });
    
    let currentMonthRevenue = 0;
    salesData.forEach(data => {
        const date = new Date(data.date);
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            currentMonthRevenue += parseFloat(data.lola_modas) + parseFloat(data.lala_daroca) + 
                                  parseFloat(data.duda_modas) + parseFloat(data.ju_dourado) + 
                                  parseFloat(data.maria_dourado);
        }
    });
    
    const html = `
        <div class="fixed-card">
            <div class="fixed-card-content">
                <div class="fixed-card-icon"><i class="fas fa-dollar-sign"></i></div>
                <div class="fixed-card-label">Faturamento Total</div>
                <div class="fixed-card-value">${formatCurrency(totalRevenue)}</div>
            </div>
        </div>
        <div class="fixed-card">
            <div class="fixed-card-content">
                <div class="fixed-card-icon"><i class="fas fa-calendar-week"></i></div>
                <div class="fixed-card-label">Últimos 7 Dias</div>
                <div class="fixed-card-value">${formatCurrency(last7DaysRevenue)}</div>
            </div>
        </div>
        <div class="fixed-card">
            <div class="fixed-card-content">
                <div class="fixed-card-icon"><i class="fas fa-calendar-alt"></i></div>
                <div class="fixed-card-label">Mês Atual</div>
                <div class="fixed-card-value">${formatCurrency(currentMonthRevenue)}</div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Update dashboard
function updateDashboard() {
    renderFixedCards();
    
    const { filtered, account } = getFilteredData();
    
    if (filtered.length === 0) {
        renderEmptyDashboard();
        return;
    }
    
    let totalRevenue = 0;
    let accountTotals = {
        'lola_modas': 0,
        'lala_daroca': 0,
        'duda_modas': 0,
        'ju_dourado': 0,
        'maria_dourado': 0
    };
    
    filtered.forEach(data => {
        if (account === 'all') {
            totalRevenue += parseFloat(data.lola_modas) + parseFloat(data.lala_daroca) + 
                           parseFloat(data.duda_modas) + parseFloat(data.ju_dourado) + 
                           parseFloat(data.maria_dourado);
            accountTotals['lola_modas'] += parseFloat(data.lola_modas);
            accountTotals['lala_daroca'] += parseFloat(data.lala_daroca);
            accountTotals['duda_modas'] += parseFloat(data.duda_modas);
            accountTotals['ju_dourado'] += parseFloat(data.ju_dourado);
            accountTotals['maria_dourado'] += parseFloat(data.maria_dourado);
        } else {
            const key = accountMap[account];
            totalRevenue += parseFloat(data[key]);
            accountTotals[key] += parseFloat(data[key]);
        }
    });
    
    const avgDaily = totalRevenue / filtered.length;
    
    let bestDay = { date: '', value: 0 };
    filtered.forEach(data => {
        let dayTotal = 0;
        if (account === 'all') {
            dayTotal = parseFloat(data.lola_modas) + parseFloat(data.lala_daroca) + 
                      parseFloat(data.duda_modas) + parseFloat(data.ju_dourado) + 
                      parseFloat(data.maria_dourado);
        } else {
            dayTotal = parseFloat(data[accountMap[account]]);
        }
        if (dayTotal > bestDay.value) {
            bestDay = { date: data.date, value: dayTotal };
        }
    });
    
    let bestAccount = { name: '', value: 0 };
    if (account === 'all') {
        Object.entries(accountTotals).forEach(([name, value]) => {
            if (value > bestAccount.value) {
                bestAccount = { name: accountMapReverse[name], value };
            }
        });
    }
    
    renderStatsCards(totalRevenue, avgDaily, bestDay, bestAccount, account);
    updateMetaProgress();
    renderRanking(accountTotals, account);
    updateCharts(filtered, accountTotals, account);
}

// Render stats cards
function renderStatsCards(total, avg, bestDay, bestAccount, accountFilter) {
    const container = document.getElementById('statsCards');
    
    let html = `
        <div class="card">
            <div class="card-icon"><i class="fas fa-filter"></i></div>
            <div class="card-label">Total Filtrado</div>
            <div class="card-value">${formatCurrency(total)}</div>
        </div>
        <div class="card">
            <div class="card-icon"><i class="fas fa-chart-line"></i></div>
            <div class="card-label">Média Diária</div>
            <div class="card-value">${formatCurrency(avg)}</div>
        </div>
        <div class="card">
            <div class="card-icon"><i class="fas fa-calendar-star"></i></div>
            <div class="card-label">Melhor Dia</div>
            <div class="card-value">${formatCurrency(bestDay.value)}</div>
            <div class="card-subvalue">${formatDate(bestDay.date)}</div>
        </div>
    `;
    
    if (accountFilter === 'all') {
        html += `
            <div class="card">
                <div class="card-icon"><i class="fas fa-trophy"></i></div>
                <div class="card-label">Melhor Conta</div>
                <div class="card-value">${formatCurrency(bestAccount.value)}</div>
                <div class="card-subvalue">${bestAccount.name}</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Update meta progress
function updateMetaProgress() {
    const now = new Date();
    const monthData = salesData.filter(d => {
        const date = new Date(d.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    let monthTotal = 0;
    monthData.forEach(data => {
        monthTotal += parseFloat(data.lola_modas) + parseFloat(data.lala_daroca) + 
                     parseFloat(data.duda_modas) + parseFloat(data.ju_dourado) + 
                     parseFloat(data.maria_dourado);
    });
    
    const percentage = Math.min((monthTotal / monthlyMeta) * 100, 100);
    
    document.getElementById('metaProgress').style.width = percentage + '%';
    document.getElementById('metaProgress').textContent = percentage.toFixed(1) + '%';
    document.getElementById('metaCurrent').textContent = formatCurrency(monthTotal);
    document.getElementById('metaTarget').textContent = 'Meta: ' + formatCurrency(monthlyMeta);
}

// Render ranking
function renderRanking(accountTotals, accountFilter) {
    const container = document.getElementById('rankingContainer');
    
    if (accountFilter !== 'all') {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <i class="fas fa-filter"></i>
                <h3>Ranking disponível apenas com "Todas as Contas"</h3>
            </div>
        `;
        return;
    }
    
    const sorted = Object.entries(accountTotals)
        .map(([key, value]) => ({ name: accountMapReverse[key], value }))
        .sort((a, b) => b.value - a.value);
    
    let html = '';
    sorted.forEach((item, index) => {
        html += `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}º</div>
                <div class="ranking-account">${item.name}</div>
                <div class="ranking-value">${formatCurrency(item.value)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Update charts
function updateCharts(filtered, accountTotals, accountFilter) {
    if (lineChart) lineChart.destroy();
    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();
    
    const lineLabels = filtered.map(d => formatDate(d.date));
    let lineData = [];
    
    if (accountFilter === 'all') {
        lineData = filtered.map(d => 
            parseFloat(d.lola_modas) + parseFloat(d.lala_daroca) + 
            parseFloat(d.duda_modas) + parseFloat(d.ju_dourado) + 
            parseFloat(d.maria_dourado)
        );
    } else {
        lineData = filtered.map(d => parseFloat(d[accountMap[accountFilter]]));
    }
    
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: lineLabels,
            datasets: [{
                label: 'Faturamento',
                data: lineData,
                borderColor: '#FE2C55',
                backgroundColor: 'rgba(254, 44, 85, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#888',
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    },
                    grid: { color: '#2a2a2a' }
                },
                x: {
                    ticks: { color: '#888' },
                    grid: { color: '#2a2a2a' }
                }
            }
        }
    });
    
    if (accountFilter === 'all') {
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['@lolamodas.ia', '@laladaroca', '@dudamodas05', '@judourado.shop', '@mariadourado.shop'],
                datasets: [{
                    data: [
                        accountTotals.lola_modas,
                        accountTotals.lala_daroca,
                        accountTotals.duda_modas,
                        accountTotals.ju_dourado,
                        accountTotals.maria_dourado
                    ],
                    backgroundColor: ['#FE2C55', '#25F4EE', '#9D4EDD', '#FFB800', '#00D9FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#888', padding: 15 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': R$ ' + context.parsed.toFixed(2) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    } else {
        document.getElementById('pieChart').parentElement.innerHTML = `
            <div class="empty-state" style="padding: 60px 20px;">
                <i class="fas fa-filter"></i>
                <h3>Gráfico disponível apenas com "Todas as Contas"</h3>
            </div>
        `;
    }
    
    const barCtx = document.getElementById('barChart').getContext('2d');
    
    if (accountFilter === 'all') {
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['@lolamodas.ia', '@laladaroca', '@dudamodas05', '@judourado.shop', '@mariadourado.shop'],
                datasets: [{
                    label: 'Faturamento',
                    data: [
                        accountTotals.lola_modas,
                        accountTotals.lala_daroca,
                        accountTotals.duda_modas,
                        accountTotals.ju_dourado,
                        accountTotals.maria_dourado
                    ],
                    backgroundColor: ['#FE2C55', '#25F4EE', '#9D4EDD', '#FFB800', '#00D9FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'R$ ' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(0);
                            }
                        },
                        grid: { color: '#2a2a2a' }
                    },
                    x: {
                        ticks: { color: '#888' },
                        grid: { display: false }
                    }
                }
            }
        });
    } else {
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: lineLabels,
                datasets: [{
                    label: accountFilter,
                    data: lineData,
                    backgroundColor: '#FE2C55'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'R$ ' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(0);
                            }
                        },
                        grid: { color: '#2a2a2a' }
                    },
                    x: {
                        ticks: { color: '#888' },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

// Render empty dashboard
function renderEmptyDashboard() {
    document.getElementById('statsCards').innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; padding: 60px 20px;">
            <i class="fas fa-chart-line"></i>
            <h3>Nenhum dado encontrado para este período</h3>
            <p>Ajuste os filtros ou adicione novos registros</p>
        </div>
    `;
    
    document.getElementById('rankingContainer').innerHTML = `
        <div class="empty-state" style="padding: 40px 20px;">
            <i class="fas fa-inbox"></i>
            <h3>Sem dados para exibir</h3>
        </div>
    `;
    
    if (lineChart) lineChart.destroy();
    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();
}

// Export to Excel
async function exportExcel() {
    const account = document.getElementById('filterAccount').value;
    const period = document.getElementById('filterPeriod').value;
    
    let params = new URLSearchParams({ account });
    
    if (period === 'custom') {
        const startDate = document.getElementById('customStartDate').value;
        const endDate = document.getElementById('customEndDate').value;
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
    } else if (period === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        params.append('startDate', today);
        params.append('endDate', today);
    } else if (period === 'weekly') {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.append('startDate', weekAgo.toISOString().split('T')[0]);
        params.append('endDate', now.toISOString().split('T')[0]);
    } else if (period === 'monthly') {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        params.append('startDate', monthStart.toISOString().split('T')[0]);
        params.append('endDate', now.toISOString().split('T')[0]);
    }
    
    try {
        const response = await fetch(`/api/export?${params}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vendas-tiktok-${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showAlert('dashboard', 'success', 'Excel exportado com sucesso!');
        } else {
            showAlert('dashboard', 'error', 'Erro ao exportar Excel');
        }
    } catch (error) {
        console.error('Erro ao exportar:', error);
        showAlert('dashboard', 'error', 'Erro ao exportar Excel');
    }
}

// Show alert
function showAlert(tab, type, message) {
    const alertId = tab === 'dashboard' ? 'alertDashboard' : 'alertManage';
    const alert = document.getElementById(alertId);
    
    alert.className = `alert alert-${type} show`;
    alert.textContent = message;
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 4000);
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
