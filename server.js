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
    await loadData();
    await loadMeta();
    setTodayDate();
    updateDashboard();
    renderTable();
});

// Logout (desabilitado temporariamente)
async function logout() {
    alert('Login desabilitado temporariamente');
}
