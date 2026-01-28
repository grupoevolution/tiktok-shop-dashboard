require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('✓ Conectado ao PostgreSQL:', res.rows[0].now);
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes

// Dashboard page (sem login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Get all sales
app.get('/api/sales', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM sales ORDER BY date DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro ao buscar vendas' });
    }
});

// Create sale
app.post('/api/sales', async (req, res) => {
    const { date, lola_modas, lala_daroca, duda_modas, ju_dourado, maria_dourado } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO sales (date, lola_modas, lala_daroca, duda_modas, ju_dourado, maria_dourado) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [date, lola_modas, lala_daroca, duda_modas, ju_dourado, maria_dourado]
        );
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Já existe um registro para esta data' });
        } else {
            console.error('Erro ao criar venda:', error);
            res.status(500).json({ error: 'Erro ao criar venda' });
        }
    }
});

// Update sale
app.put('/api/sales/:id', async (req, res) => {
    const { id } = req.params;
    const { date, lola_modas, lala_daroca, duda_modas, ju_dourado, maria_dourado } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE sales 
             SET date = $1, lola_modas = $2, lala_daroca = $3, duda_modas = $4, 
                 ju_dourado = $5, maria_dourado = $6
             WHERE id = $7 
             RETURNING *`,
            [date, lola_modas, lala_daroca, duda_modas, ju_dourado, maria_dourado, id]
        );
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Registro não encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Já existe outro registro para esta data' });
        } else {
            console.error('Erro ao atualizar venda:', error);
            res.status(500).json({ error: 'Erro ao atualizar venda' });
        }
    }
});

// Delete sale
app.delete('/api/sales/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query('DELETE FROM sales WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Registro não encontrado' });
        } else {
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Erro ao deletar venda:', error);
        res.status(500).json({ error: 'Erro ao deletar venda' });
    }
});

// Get monthly meta
app.get('/api/settings/meta', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT value FROM settings WHERE key = 'monthly_meta'"
        );
        res.json({ meta: parseFloat(result.rows[0].value) });
    } catch (error) {
        console.error('Erro ao buscar meta:', error);
        res.status(500).json({ error: 'Erro ao buscar meta' });
    }
});

// Update monthly meta
app.put('/api/settings/meta', async (req, res) => {
    const { meta } = req.body;
    
    try {
        await pool.query(
            "UPDATE settings SET value = $1 WHERE key = 'monthly_meta'",
            [meta.toString()]
        );
        res.json({ success: true, meta });
    } catch (error) {
        console.error('Erro ao atualizar meta:', error);
        res.status(500).json({ error: 'Erro ao atualizar meta' });
    }
});

// Export to Excel
app.get('/api/export', async (req, res) => {
    const { startDate, endDate, account } = req.query;
    
    try {
        let query = 'SELECT * FROM sales WHERE 1=1';
        const params = [];
        
        if (startDate) {
            params.push(startDate);
            query += ` AND date >= $${params.length}`;
        }
        
        if (endDate) {
            params.push(endDate);
            query += ` AND date <= $${params.length}`;
        }
        
        query += ' ORDER BY date ASC';
        
        const result = await pool.query(query, params);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Vendas TikTok Shop');
        
        const columns = [
            { header: 'Data', key: 'date', width: 15 },
            { header: '@lolamodas.ia', key: 'lola_modas', width: 18 },
            { header: '@laladaroca', key: 'lala_daroca', width: 18 },
            { header: '@dudamodas05', key: 'duda_modas', width: 18 },
            { header: '@judourado.shop', key: 'ju_dourado', width: 20 },
            { header: '@mariadourado.shop', key: 'maria_dourado', width: 22 },
            { header: 'Total', key: 'total', width: 18 }
        ];
        
        if (account && account !== 'all') {
            const accountMap = {
                '@lolamodas.ia': 'lola_modas',
                '@laladaroca': 'lala_daroca',
                '@dudamodas05': 'duda_modas',
                '@judourado.shop': 'ju_dourado',
                '@mariadourado.shop': 'maria_dourado'
            };
            
            worksheet.columns = [
                { header: 'Data', key: 'date', width: 15 },
                { header: account, key: accountMap[account], width: 20 }
            ];
        } else {
            worksheet.columns = columns;
        }
        
        worksheet.getRow(1).font = { bold: true, size: 12 };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFE2C55' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        
        let totalGeneral = {
            lola_modas: 0,
            lala_daroca: 0,
            duda_modas: 0,
            ju_dourado: 0,
            maria_dourado: 0
        };
        
        result.rows.forEach(row => {
            const date = new Date(row.date);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            
            const rowTotal = parseFloat(row.lola_modas) + parseFloat(row.lala_daroca) + 
                           parseFloat(row.duda_modas) + parseFloat(row.ju_dourado) + 
                           parseFloat(row.maria_dourado);
            
            totalGeneral.lola_modas += parseFloat(row.lola_modas);
            totalGeneral.lala_daroca += parseFloat(row.lala_daroca);
            totalGeneral.duda_modas += parseFloat(row.duda_modas);
            totalGeneral.ju_dourado += parseFloat(row.ju_dourado);
            totalGeneral.maria_dourado += parseFloat(row.maria_dourado);
            
            if (account && account !== 'all') {
                const accountMap = {
                    '@lolamodas.ia': 'lola_modas',
                    '@laladaroca': 'lala_daroca',
                    '@dudamodas05': 'duda_modas',
                    '@judourado.shop': 'ju_dourado',
                    '@mariadourado.shop': 'maria_dourado'
                };
                
                worksheet.addRow({
                    date: formattedDate,
                    [accountMap[account]]: parseFloat(row[accountMap[account]])
                });
            } else {
                worksheet.addRow({
                    date: formattedDate,
                    lola_modas: parseFloat(row.lola_modas),
                    lala_daroca: parseFloat(row.lala_daroca),
                    duda_modas: parseFloat(row.duda_modas),
                    ju_dourado: parseFloat(row.ju_dourado),
                    maria_dourado: parseFloat(row.maria_dourado),
                    total: rowTotal
                });
            }
        });
        
        worksheet.addRow({});
        
        const accountMap = {
            '@lolamodas.ia': 'lola_modas',
            '@laladaroca': 'lala_daroca',
            '@dudamodas05': 'duda_modas',
            '@judourado.shop': 'ju_dourado',
            '@mariadourado.shop': 'maria_dourado'
        };
        
        const totalRowData = (account && account !== 'all') ? {
            date: 'TOTAL',
            [accountMap[account]]: totalGeneral[accountMap[account]]
        } : {
            date: 'TOTAL',
            lola_modas: totalGeneral.lola_modas,
            lala_daroca: totalGeneral.lala_daroca,
            duda_modas: totalGeneral.duda_modas,
            ju_dourado: totalGeneral.ju_dourado,
            maria_dourado: totalGeneral.maria_dourado,
            total: totalGeneral.lola_modas + totalGeneral.lala_daroca + 
                   totalGeneral.duda_modas + totalGeneral.ju_dourado + 
                   totalGeneral.maria_dourado
        };
        
        const totalRow = worksheet.addRow(totalRowData);
        
        totalRow.font = { bold: true };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.eachCell((cell, colNumber) => {
                    if (colNumber > 1) {
                        cell.numFmt = 'R$ #,##0.00';
                        cell.alignment = { horizontal: 'right' };
                    }
                });
            }
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=vendas-tiktok-${Date.now()}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        res.status(500).json({ error: 'Erro ao exportar dados' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Servidor rodando na porta ${PORT}`);
});
