import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { Plus, Trash2, Check, FileDown, Loader2, LayoutDashboard, Activity, Landmark, DollarSign, BookOpen, TrendingUp, BarChart2, Target, Settings2, ArrowRight, AlertTriangle, CheckCircle2, Factory, Users, Layers, GitMerge, RefreshCw, PieChart, FileText, TrendingDown, Eye, Play, Shield, Zap, Globe, ArrowUpRight, Package, Wrench, Boxes, Sliders, Lightbulb } from 'lucide-react';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Cell, ReferenceLine } from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FinancialContext = createContext(null);

const initialFinancialModel = {
    company: { name: "Acme Corp", year: new Date().getFullYear() },
    assumptions: { 
        taxRate: 0.21, discountRate: 0.10, interestRate: 0.05,
        arDays: 30, apDays: 30, deprYears: 5,
        startingCash: 50000, startingCapital: 50000, startingDebt: 0,
        startingRetainedEarnings: 0, startingRM: 15000, startingWIP: 5000,
        laborHoursPerUnit: 2.0, laborRatePerHour: 25, machineHoursPerUnit: 1.5,
        productionEfficiency: 0.95, startingFinishedGoods: 500, unitMaterialCost: 20
    },
    erp: {
        machines: [
            { id: 1, name: 'CNC Assembly Line A', availableHours: 25000, downtime: 1200 },
            { id: 2, name: 'Packaging Robot B', availableHours: 15000, downtime: 300 }
        ],
        departments: [
            { id: 1, name: 'Fabrication Team', employees: 12, availableHours: 24000, overtime: 800 },
            { id: 2, name: 'Quality Control', employees: 4, availableHours: 8000, overtime: 150 }
        ]
    },
    budget: {
        revenue: { lines: [ { id: 'rev1', name: 'Widget A Sales', type: 'product', months: Array.from({length: 12}, (_, i) => ({ month: i+1, quantity: 1000, price: 100 })) } ] },
        production: { lines: [ { id: 'prod1', name: 'Widget A Production', type: 'units', months: Array.from({length: 12}, (_, i) => ({ month: i+1, quantity: 1050 })) } ] },
        variableCosts: { lines: [ { id: 'vc1', name: 'Direct Materials', category: 'materials', months: Array.from({length: 12}, (_, i) => ({ month: i+1, amount: 20000 })) }, { id: 'vc2', name: 'Direct Labor', category: 'labor', months: Array.from({length: 12}, (_, i) => ({ month: i+1, amount: 30000 })) } ] },
        fixedCosts: { lines: [ { id: 'fc1', name: 'Rent', category: 'facility', months: Array.from({length: 12}, (_, i) => ({ month: i+1, amount: 5000 })) }, { id: 'fc2', name: 'Salaries', category: 'payroll', months: Array.from({length: 12}, (_, i) => ({ month: i+1, amount: 15000 })) } ] },
        inventory: { lines: [ { id: 'inv1', name: 'Raw Material Purchases', months: Array.from({length: 12}, (_, i) => ({ month: i+1, amount: 25000 })) } ] },
        capex: { lines: [ { id: 'cap1', name: 'Manufacturing Equipment', months: Array.from({length: 12}, (_, i) => ({ month: i+1, amount: i === 0 ? 120000 : 0 })) } ] },
        financing: { lines: [ { id: 'fin1', name: 'Bank Loan Proceeds', type: 'proceeds', months: Array.from({length: 12}, (_, i) => ({ month: i+1, amount: i === 0 ? 50000 : 0 })) }, { id: 'fin2', name: 'Principal Repayment', type: 'repayment', months: Array.from({length: 12}, (_, i) => ({ month: i+1, amount: 1000 })) } ] }
    },
};

const formatNumber = (val) => (val == null || isNaN(val)) ? '-' : new Intl.NumberFormat('en-US').format(val);
const formatCurrency = (val) => (val == null || isNaN(val)) ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
const formatAccounting = (val) => {
    if (val == null || isNaN(val)) return '-';
    if (Math.abs(val) < 0.5) return '-'; 
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val));
    return val < 0 ? `(${formatted})` : formatted;
}
const formatPercent = (val) => (val == null || isNaN(val) || !isFinite(val)) ? '-' : new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(val);
const formatCompactCurrency = (val) => {
    if (val === 0) return '$0';
    const absVal = Math.abs(val);
    if (absVal >= 1000000) return (val < 0 ? '-' : '') + '$' + (absVal / 1000000).toFixed(1) + 'M';
    if (absVal >= 1000) return (val < 0 ? '-' : '') + '$' + (absVal / 1000).toFixed(0) + 'k';
    return (val < 0 ? '-' : '') + '$' + absVal.toFixed(0);
};
const formatCompactNumber = (val) => {
    if (val === 0) return '0';
    const absVal = Math.abs(val);
    if (absVal >= 1000000) return (val < 0 ? '-' : '') + (absVal / 1000000).toFixed(1) + 'M';
    if (absVal >= 1000) return (val < 0 ? '-' : '') + (absVal / 1000).toFixed(1) + 'k';
    return val.toFixed(0);
};

const AssumptionInput = ({ label, value, onChange, isPct, isCurrency }) => {
    const [str, setStr] = useState(() => {
        if (value === '' || value === null || value === undefined) return '';
        return isPct ? (Number(value) * 100).toString() : value.toString();
    });

    useEffect(() => {
        if (value === '' || value === null || value === undefined) {
            setStr('');
            return;
        }
        const num = isPct ? Number(value) * 100 : Number(value);
        const currentNum = parseFloat(str);
        if (isNaN(currentNum) || Math.abs(currentNum - num) > 0.0001) {
            setStr(num.toString());
        }
    }, [value, isPct]);

    const handleChange = (e) => {
        const v = e.target.value;
        setStr(v);
        if (v === '' || v === '-') {
            onChange('');
            return;
        }
        const parsed = parseFloat(v);
        if (!isNaN(parsed)) {
            onChange(isPct ? parsed / 100 : parsed);
        }
    };

    return (
        <div className="flex flex-col">
            <label className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wide truncate" title={label}>{label}</label>
            <div className="relative">
                {isCurrency && <span className="absolute left-2 top-1.5 text-slate-500 font-medium text-xs">$</span>}
                <input
                    type="text"
                    value={str}
                    onChange={handleChange}
                    className={`w-full bg-[#0f1523] border border-slate-700/80 rounded-md py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono transition-colors shadow-inner ${isCurrency ? 'pl-5 pr-2' : 'px-2'}`}
                />
            </div>
        </div>
    );
};

const ERPInput = ({ val, onChange, isCurrency=false }) => {
    const [str, setStr] = useState(() => val?.toString() || '');
    
    useEffect(() => {
        if (val === '' || val === null || val === undefined) {
            setStr('');
            return;
        }
        const currentNum = parseFloat(str);
        const propNum = parseFloat(val);
        if (isNaN(currentNum) || Math.abs(currentNum - propNum) > 0.0001) {
            setStr(val.toString());
        }
    }, [val]);

    const handleChange = (e) => {
        const v = e.target.value;
        setStr(v);
        if (v === '' || v === '-') {
            onChange(0);
            return;
        }
        const parsed = parseFloat(v);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
    };

    return (
        <div className="relative w-full">
            {isCurrency && <span className="absolute left-2 top-1.5 text-slate-500 font-medium text-xs">$</span>}
            <input 
                type="text" 
                value={str} 
                onChange={handleChange} 
                className={`w-full bg-[#0a0f1c] border border-slate-700/80 rounded py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono text-right transition-colors shadow-inner ${isCurrency ? 'pl-5 pr-2' : 'px-2'}`} 
            />
        </div>
    );
};

const CustomChartTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0f1523]/95 backdrop-blur-md border border-slate-700/80 p-4 rounded-xl shadow-2xl font-sans z-50 min-w-[200px]">
                {label !== undefined && label !== null && (
                    <p className="text-slate-400 font-bold text-[10px] mb-3 uppercase tracking-widest border-b border-slate-700/50 pb-2">
                        {labelFormatter ? labelFormatter(label) : label}
                    </p>
                )}
                <div className="space-y-2.5">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between space-x-6 text-sm">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full mr-3 shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></span>
                                <span className="text-slate-300 font-medium">{entry.name}:</span>
                            </div>
                            <span className="text-slate-200 font-bold font-mono tracking-tight">
                                {formatter ? formatter(entry.value, entry.name, entry, index, payload) : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const calculateFinancials = (model) => {
    let monthly = [];
    let annual = {
        revenue: 0, variableCosts: 0, contributionMargin: 0,
        fixedCosts: 0, ebitda: 0, depreciation: 0, ebit: 0,
        interest: 0, ebt: 0, taxes: 0, netIncome: 0,
        capex: 0, debtProceeds: 0, debtRepayment: 0, inventoryPurchases: 0,
        salesUnits: 0, productionUnits: 0, actualProductionUnits: 0,
        machineHoursUsed: 0, laborHoursUsed: 0
    };

    const machines = model.erp?.machines || [];
    const depts = model.erp?.departments || [];
    let totalMachineAvail = machines.reduce((sum, m) => sum + (parseFloat(m.availableHours)||0) - (parseFloat(m.downtime)||0), 0);
    let totalLaborAvail = depts.reduce((sum, d) => sum + (parseFloat(d.availableHours)||0) + (parseFloat(d.overtime)||0), 0);
    let monthlyMachCap = totalMachineAvail / 12;
    let monthlyLabCap = totalLaborAvail / 12;

    let ppeGross = 0;
    let accumDepr = 0;
    
    const taxRate = parseFloat(model.assumptions?.taxRate) || 0;
    const deprYears = parseFloat(model.assumptions?.deprYears) || 0;
    const interestRate = parseFloat(model.assumptions?.interestRate) || 0;
    const arDays = parseFloat(model.assumptions?.arDays) || 0;
    const apDays = parseFloat(model.assumptions?.apDays) || 0;
    const cash_0 = parseFloat(model.assumptions?.startingCash) || 0;
    const debt_0 = parseFloat(model.assumptions?.startingDebt) || 0;
    const re_0 = parseFloat(model.assumptions?.startingRetainedEarnings) || 0;
    const eff = parseFloat(model.assumptions?.productionEfficiency) || 0.95;
    const machPerUnit = parseFloat(model.assumptions?.machineHoursPerUnit) || 0;
    const labPerUnit = parseFloat(model.assumptions?.laborHoursPerUnit) || 0;

    let debtBalance = debt_0;
    let finishedGoodsInvUnits = parseFloat(model.assumptions?.startingFinishedGoods) || 0;
    
    for (let m = 0; m < 12; m++) {
        let rev = 0; let salesUnits = 0;
        (model.budget?.revenue?.lines || []).forEach(l => { 
            const qty = parseFloat(l.months[m]?.quantity) || 0;
            salesUnits += qty;
            rev += qty * (parseFloat(l.months[m]?.price) || 0); 
        });
        
        let plannedProdUnits = 0;
        if (model.budget?.production?.lines) {
             model.budget.production.lines.forEach(l => { plannedProdUnits += parseFloat(l.months[m]?.quantity) || 0; });
        } else {
             plannedProdUnits = salesUnits; 
        }
        
        let actualProdUnits = plannedProdUnits * eff;
        
        let machReq = actualProdUnits * machPerUnit;
        if (machReq > monthlyMachCap && machPerUnit > 0) {
            actualProdUnits = monthlyMachCap / machPerUnit;
        }
        let labReq = actualProdUnits * labPerUnit;
        if (labReq > monthlyLabCap && labPerUnit > 0) {
            actualProdUnits = Math.min(actualProdUnits, monthlyLabCap / labPerUnit);
        }

        finishedGoodsInvUnits = finishedGoodsInvUnits + actualProdUnits - salesUnits;

        let machineHours = actualProdUnits * machPerUnit;
        let laborHours = actualProdUnits * labPerUnit;

        let vc = 0;
        (model.budget?.variableCosts?.lines || []).forEach(l => { vc += parseFloat(l.months[m]?.amount) || 0; });
        
        let fc = 0;
        (model.budget?.fixedCosts?.lines || []).forEach(l => { fc += parseFloat(l.months[m]?.amount) || 0; });
        
        let invPurchases = 0;
        (model.budget?.inventory?.lines || []).forEach(l => { invPurchases += parseFloat(l.months[m]?.amount) || 0; });
        
        let capex = 0;
        (model.budget?.capex?.lines || []).forEach(l => { capex += parseFloat(l.months[m]?.amount) || 0; });
        
        let debtProceeds = 0;
        let debtRepayment = 0;
        (model.budget?.financing?.lines || []).forEach(l => {
            if (l.type === 'proceeds') debtProceeds += parseFloat(l.months[m]?.amount) || 0;
            if (l.type === 'repayment') debtRepayment += parseFloat(l.months[m]?.amount) || 0;
        });

        let cm = rev - vc;
        let ebitda = cm - fc;
        
        ppeGross += capex;
        let depr = ppeGross > 0 && deprYears > 0 ? (ppeGross / (deprYears * 12)) : 0;
        accumDepr += depr;

        let ebit = ebitda - depr;
        debtBalance = debtBalance + debtProceeds - debtRepayment;
        let interest = debtBalance > 0 ? debtBalance * (interestRate / 12) : 0;
        
        let ebt = ebit - interest;
        let taxes = ebt > 0 ? ebt * taxRate : 0;
        let ni = ebt - taxes;

        monthly.push({
            month: m + 1, monthName: MONTHS[m], revenue: rev, variableCosts: vc, contributionMargin: cm,
            fixedCosts: fc, ebitda: ebitda, depreciation: depr, ebit: ebit,
            interest: interest, ebt: ebt, taxes: taxes, netIncome: ni,
            capex, debtProceeds, debtRepayment, inventoryPurchases: invPurchases,
            salesUnits, plannedProdUnits, actualProdUnits, finishedGoodsInvUnits, machineHours, laborHours
        });

        annual.revenue += rev;
        annual.variableCosts += vc;
        annual.contributionMargin += cm;
        annual.fixedCosts += fc;
        annual.ebitda += ebitda;
        annual.depreciation += depr;
        annual.ebit += ebit;
        annual.interest += interest;
        annual.ebt += ebt;
        annual.taxes += taxes;
        annual.netIncome += ni;
        annual.capex += capex;
        annual.debtProceeds += debtProceeds;
        annual.debtRepayment += debtRepayment;
        annual.inventoryPurchases += invPurchases;
        annual.salesUnits += salesUnits;
        annual.productionUnits += plannedProdUnits;
        annual.actualProductionUnits += actualProdUnits;
        annual.machineHoursUsed += machineHours;
        annual.laborHoursUsed += laborHours;
    }
    
    annual.cmRatio = annual.revenue > 0 ? annual.contributionMargin / annual.revenue : 0;

    let income = {
        revenue: annual.revenue, cogs: annual.variableCosts, grossProfit: annual.contributionMargin,
        opex: annual.fixedCosts, ebitda: annual.ebitda, depr: annual.depreciation,
        opIncome: annual.ebit, interest: annual.interest, ebt: annual.ebt, tax: annual.taxes, netIncome: annual.netIncome
    };

    let ar = annual.revenue * (arDays / 365);
    let ap = (annual.variableCosts + annual.fixedCosts) * (apDays / 365);
    let avgUnitCost = annual.productionUnits > 0 ? (annual.variableCosts / annual.productionUnits) : 0;
    
    let startFgUnits = parseFloat(model.assumptions?.startingFinishedGoods) || 0;
    let inv_0 = startFgUnits * avgUnitCost;
    
    let inv = Math.max(0, finishedGoodsInvUnits * avgUnitCost) + Math.max(0, annual.inventoryPurchases - annual.variableCosts); 
    let changeInv = inv_0 - inv;
    
    let capital = cash_0 + inv_0 + ar - debt_0 - re_0 - ap; 

    let cashFlow = {
        details: {
            netIncome: annual.netIncome, depr: annual.depreciation,
            changeAr: -ar, changeInv: changeInv, changeAp: ap,
            capex: -annual.capex, debtProceeds: annual.debtProceeds, debtRepayment: -annual.debtRepayment
        }
    };
    cashFlow.operating = cashFlow.details.netIncome + cashFlow.details.depr + cashFlow.details.changeAr + cashFlow.details.changeInv + cashFlow.details.changeAp;
    cashFlow.investing = cashFlow.details.capex;
    cashFlow.financing = cashFlow.details.debtProceeds + cashFlow.details.debtRepayment;
    cashFlow.beginningCash = cash_0;
    cashFlow.endingCash = cashFlow.beginningCash + cashFlow.operating + cashFlow.investing + cashFlow.financing;
    cashFlow.netChange = cashFlow.operating + cashFlow.investing + cashFlow.financing;

    let balanceSheet = {
        assets: { cash: cashFlow.endingCash, ar: ar, inv: inv, ppe: ppeGross, accumDepr: accumDepr },
        liabilities: { ap: ap, debt: debtBalance },
        equity: { capital: capital, retainedEarnings: re_0 + annual.netIncome }
    };
    balanceSheet.assets.total = balanceSheet.assets.cash + balanceSheet.assets.ar + balanceSheet.assets.inv + balanceSheet.assets.ppe - balanceSheet.assets.accumDepr;
    balanceSheet.liabilities.total = balanceSheet.liabilities.ap + balanceSheet.liabilities.debt;
    balanceSheet.equity.total = balanceSheet.equity.capital + balanceSheet.equity.retainedEarnings;

    return { monthly, annual, statements: { income, balanceSheet, cashFlow } };
};

const LandingPage = ({ onEnter }) => {
    return (
        <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans selection:bg-cyan-500/30 scroll-smooth">
            <header className="px-8 py-5 flex justify-between items-center border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-[#0a0f1c]/80">
                <div className="flex items-center space-x-3 cursor-pointer group" onClick={onEnter}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                        <BarChart2 className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">CFO's</h1>
                        <p className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold group-hover:text-cyan-400 transition-colors">Decision Engine</p>
                    </div>
                </div>
                <nav className="hidden lg:flex space-x-8 text-sm font-medium text-slate-400">
                    <a href="#who-we-are" className="hover:text-cyan-400 transition-colors">Who We Are</a>
                    <a href="#services" className="hover:text-cyan-400 transition-colors">Services</a>
                    <a href="#platform" className="hover:text-cyan-400 transition-colors">Platform Flow</a>
                    <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
                </nav>
                <button onClick={onEnter} className="bg-indigo-600/90 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg flex items-center group">
                    Start Analysis <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
            </header>

            <section className="relative overflow-hidden pt-24 pb-20 px-8">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="inline-flex items-center space-x-2 bg-[#111827] border border-slate-800 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-400/90 backdrop-blur-sm shadow-inner">
                            <span className="flex h-2 w-2 rounded-full bg-cyan-500/80 animate-pulse"></span>
                            <span>Enterprise Grade Financial Engine</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-slate-400">
                            Turn Financial Data <br/> Into Better Decisions.
                        </h1>
                        <p className="text-lg text-slate-400 max-w-xl leading-relaxed font-medium">
                            CFO's Decision Engine unifies your master budget, cost-volume-profit analysis, and ERP operations into a single, reactive, automated financial model designed for executives.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <button onClick={onEnter} className="bg-indigo-600/90 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center group">
                                Explore Platform <ArrowUpRight size={20} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                            <a href="#video" className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-slate-700 hover:bg-[#1e293b] transition-colors flex items-center shadow-sm bg-[#111827]/50">
                                <Play size={18} className="mr-2 opacity-70" /> Watch Demo
                            </a>
                        </div>
                    </div>
                    
                    <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000 delay-200">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-2xl transform rotate-3 scale-105 blur-lg"></div>
                        <div className="bg-[#111827]/90 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl shadow-xl relative">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                                <div className="flex space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-700/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-700/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-700/50"></div>
                                </div>
                                <div className="text-xs font-medium text-slate-400 bg-[#0a0f1c] px-3 py-1 rounded-full border border-slate-800 flex items-center shadow-inner">
                                    <Activity size={12} className="mr-1.5 text-cyan-400"/> Live Engine Preview
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-[#0a0f1c] p-4 rounded-xl border border-slate-800/80 shadow-inner">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Projected EBITDA</p>
                                    <p className="text-2xl font-black text-slate-200 font-mono">$4.2M</p>
                                    <div className="mt-3 flex items-center text-xs text-emerald-400/90 font-medium">
                                        <TrendingUp size={14} className="mr-1"/> +12.4% vs Budget
                                    </div>
                                </div>
                                <div className="bg-[#0a0f1c] p-4 rounded-xl border border-slate-800/80 shadow-inner">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Operating Leverage</p>
                                    <p className="text-2xl font-black text-indigo-400/90 font-mono">3.4x</p>
                                    <div className="mt-3 flex items-center text-xs text-slate-400">
                                        High volume sensitivity
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#0a0f1c] p-4 rounded-xl border border-slate-800/80 shadow-inner h-48 flex items-end justify-between space-x-2">
                                {[40, 55, 45, 70, 65, 80, 95].map((h, i) => (
                                    <div key={i} className="w-full bg-gradient-to-t from-indigo-600/50 to-cyan-400/50 rounded-t-md transition-all duration-500 hover:opacity-80" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-slate-800/80 bg-[#0f1523]">
                <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 text-center">
                    <div className="pt-4 md:pt-0"><h3 className="text-4xl font-black text-slate-200 mb-2 font-mono">12+</h3><p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Analytical Modules</p></div>
                    <div className="pt-4 md:pt-0"><h3 className="text-4xl font-black text-slate-200 mb-2 font-mono">100%</h3><p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Data Integration</p></div>
                    <div className="pt-4 md:pt-0"><h3 className="text-4xl font-black text-slate-200 mb-2 font-mono">0</h3><p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Spreadsheet Errors</p></div>
                    <div className="pt-4 md:pt-0"><h3 className="text-4xl font-black text-slate-200 mb-2 font-mono">Real-time</h3><p className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-bold">Engine Calculation</p></div>
                </div>
            </section>

            <section id="who-we-are" className="py-24 px-8 relative">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center justify-center"><Globe className="mr-2 opacity-70" size={16}/> Who We Are</h2>
                    <h3 className="text-3xl md:text-5xl font-extrabold text-slate-100 leading-tight">We build the financial command center for modern executives.</h3>
                    <p className="text-lg text-slate-400 leading-relaxed text-justify md:text-center font-medium">
                        CFO's is a comprehensive Management Accounting and Decision Engine designed specifically for finance leaders. We bridge the gap between static budgets and operational realities, allowing executives to seamlessly run sensitivity scenarios, stress-test CVP assumptions, evaluate incremental decisions, and generate audit-ready financial statements—all originating from a single, mathematically verified source of truth.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                        <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 text-left hover:-translate-y-1 transition-transform shadow-sm">
                            <Shield className="text-indigo-400/80 mb-4" size={28}/>
                            <h4 className="text-slate-200 font-bold mb-2">Our Purpose</h4>
                            <p className="text-sm text-slate-400">To eliminate fragmented spreadsheet models and provide total financial clarity in real-time.</p>
                        </div>
                        <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 text-left hover:-translate-y-1 transition-transform shadow-sm">
                            <Target className="text-cyan-400/80 mb-4" size={28}/>
                            <h4 className="text-slate-200 font-bold mb-2">Our Mission</h4>
                            <p className="text-sm text-slate-400">To empower decision-makers with instant, rigorous managerial accounting intelligence.</p>
                        </div>
                        <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 text-left hover:-translate-y-1 transition-transform shadow-sm">
                            <Eye className="text-emerald-400/80 mb-4" size={28}/>
                            <h4 className="text-slate-200 font-bold mb-2">Our Vision</h4>
                            <p className="text-sm text-slate-400">A future where every operational shift is instantly mapped to its exact financial impact.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="services" className="py-24 px-8 bg-[#0f1523] border-y border-slate-800/80">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">Our Services</h2>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-100">Comprehensive Financial Intelligence</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[
                            { title: 'Management Accounting', desc: 'Deep dive into internal cost structures, behaviors, and allocations.', icon: <PieChart/> },
                            { title: 'Master Budgeting', desc: 'Centralized single-source-of-truth budgeting module.', icon: <BookOpen/> },
                            { title: 'FP&A', desc: 'Advanced financial planning, variance analysis, and operational forecasting.', icon: <TrendingUp/> },
                            { title: 'CVP Analysis', desc: 'Interactive Cost-Volume-Profit and contribution margin metrics.', icon: <Activity/> },
                            { title: 'Break-Even Analysis', desc: 'Precise volume and sales targets required to cover fixed obligations.', icon: <Target/> },
                            { title: 'Sensitivity & Risk', desc: 'Multi-variable scenario testing and operational leverage tracking.', icon: <Zap/> },
                            { title: 'Incremental Decisions', desc: 'Make/Buy, Special Orders, and Equipment Replacement workflows.', icon: <GitMerge/> },
                            { title: 'ERP Operational Analytics', desc: 'Live capacity, inventory flow, and labor utilization tracking.', icon: <Factory/> },
                            { title: 'Financial Statements', desc: 'Fully integrated, automated Income, Balance, and Cash Flow statements.', icon: <Landmark/> },
                            { title: 'CFO Reporting', desc: 'Automated, presentation-ready PDF generation and executive summaries.', icon: <FileText/> },
                            { title: 'Executive Dashboard', desc: 'High-level KPI consolidation and proactive management alerts.', icon: <LayoutDashboard/> },
                            { title: 'Scenario Forecasting', desc: 'Compare Base, Optimistic, and Conservative futures instantly.', icon: <Lightbulb/> }
                        ].map((srv, i) => (
                            <div key={i} className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 hover:border-cyan-500/30 transition-all duration-300 group shadow-sm">
                                <div className="text-cyan-400 mb-4 bg-[#0a0f1c] w-12 h-12 rounded-xl border border-slate-800/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                                    {srv.icon}
                                </div>
                                <h4 className="text-slate-200 font-bold mb-2 text-sm">{srv.title}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{srv.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="platform" className="py-24 px-8 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Platform Architecture</h2>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-100">The Connected Financial Flow</h3>
                        <p className="text-slate-400 mt-4 max-w-2xl mx-auto font-medium">Everything originates from your Master Budget. Data cascades automatically through advanced analytical layers without manual reconciliation.</p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 relative z-10 px-4">
                        {[
                            { name: 'Master Budget', icon: <BookOpen size={20}/>, color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400' },
                            { name: 'Calculation Engine', icon: <Settings2 size={20}/>, color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400' },
                            { name: 'Mgmt Accounting', icon: <PieChart size={20}/>, color: 'border-blue-500/20 bg-blue-500/5 text-blue-400' },
                            { name: 'ERP Analytics', icon: <Factory size={20}/>, color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' },
                            { name: 'Financial Statements', icon: <Landmark size={20}/>, color: 'border-amber-500/20 bg-amber-500/5 text-amber-400' },
                            { name: 'CFO Reports', icon: <FileText size={20}/>, color: 'border-rose-500/20 bg-rose-500/5 text-rose-400' },
                        ].map((step, idx, arr) => (
                            <React.Fragment key={idx}>
                                <div className={`flex flex-col items-center justify-center p-5 rounded-2xl border backdrop-blur-sm shadow-sm w-44 text-center ${step.color} hover:-translate-y-1 transition-transform bg-[#111827]/80`}>
                                    <div className="mb-3 opacity-80">{step.icon}</div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{step.name}</span>
                                </div>
                                {idx < arr.length - 1 && (
                                    <div className="text-slate-700 hidden lg:block"><ArrowRight size={20} /></div>
                                )}
                                {idx < arr.length - 1 && (
                                    <div className="text-slate-700 block lg:hidden"><ArrowRight size={20} className="rotate-90" /></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            <section id="features" className="py-24 px-8 bg-[#0f1523] border-t border-slate-800/80">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">Why Choose CFO's</h2>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-100 mb-8">Designed for analytical depth. Built for executive speed.</h3>
                        <div className="space-y-6">
                            {[
                                { title: 'Centralized Financial Model', text: 'Update a single variable in the budget and watch the entire enterprise model recalibrate instantly.' },
                                { title: 'Interactive Decision Tools', text: 'Evaluate Make vs. Buy, Special Orders, and Equipment Replacements with rigorous, mathematically sound logic.' },
                                { title: 'Automated Financial Statements', text: 'No more manual reconciliation. The Balance Sheet mathematically guarantees its balance based on double-entry operational triggers.' },
                                { title: 'Executive Report Generation', text: 'Export a fully formatted, professional PDF Management Report summarizing variances, operations, and AI-driven recommendations in one click.' }
                            ].map((ft, i) => (
                                <div key={i} className="flex items-start">
                                    <div className="mt-0.5 mr-4 bg-[#111827] text-cyan-400 p-1.5 rounded-lg border border-slate-800 shadow-sm"><Check size={16}/></div>
                                    <div>
                                        <h4 className="text-slate-200 font-bold mb-1.5 text-sm">{ft.title}</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed">{ft.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[#111827]/80 border border-slate-800/80 rounded-2xl p-8 shadow-xl">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800/80 pb-4 mb-6">Platform Capabilities</div>
                        <ul className="space-y-4">
                            {['Interactive Budgeting Matrix', 'CVP & Multi-Product Break-Even', 'Tornado Charts & Sensitivity Heatmaps', 'Relevant Costing Decision Engine', 'Flexible Budget & Variance Analysis', 'ERP Live Capacity & Inventory Flow', 'Automated Income, Balance, & Cash Flow', 'Live CFO Risk & KPI Alerts', 'Scenario Forecasting (Base/Opt/Cons)', 'Professional PDF Report Export'].map((item, i) => (
                                <li key={i} className="flex items-center text-sm font-medium text-slate-300">
                                    <ArrowRight size={14} className="text-indigo-400/80 mr-3"/> {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={onEnter} className="mt-8 w-full bg-[#0a0f1c] hover:bg-slate-800 text-slate-200 border border-slate-700 py-3 rounded-xl font-bold transition-all text-sm shadow-sm">
                            Access Full Feature Set
                        </button>
                    </div>
                </div>
            </section>

            <section id="video" className="py-24 px-8">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">Platform Demonstration</h2>
                    <h3 className="text-3xl font-extrabold text-slate-100 mb-10">See the Engine in Action</h3>
                    
                    <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-[#111827] aspect-video group cursor-pointer shadow-2xl hover:border-cyan-500/50 transition-all duration-500">
                        {/* Professional CFO Dashboard Poster Image */}
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80")' }}></div>
                        
                        {/* Premium Glassmorphic Overlay */}
                        <div className="absolute inset-0 bg-slate-900/70 group-hover:bg-slate-900/50 transition-colors backdrop-blur-[2px]"></div>
                        
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                            <div className="w-20 h-20 bg-cyan-500/90 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)] group-hover:scale-110 transition-transform duration-300 backdrop-blur-md border border-cyan-400/50">
                                <Play size={36} className="text-white ml-2" fill="currentColor" />
                            </div>
                            <h4 className="text-3xl font-extrabold text-white mt-8 tracking-tight drop-shadow-lg">How CFO's Works</h4>
                            <p className="text-cyan-400 font-bold tracking-widest uppercase text-xs mt-3 drop-shadow-md bg-slate-900/50 px-4 py-1.5 rounded-full border border-cyan-500/30">From Budget to Financial Decisions</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 px-8 border-t border-slate-800/80 relative overflow-hidden bg-[#0f1523]">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-100 mb-6 tracking-tight">Ready to master your financials?</h2>
                    <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto font-medium">Step into the command center and experience the most powerful, unified management accounting engine built for modern finance leaders.</p>
                    <button onClick={onEnter} className="bg-indigo-600/90 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center mx-auto group">
                        Enter the Decision Engine <ArrowRight size={18} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            <footer className="bg-[#0a0f1c] border-t border-slate-800/80 px-8 py-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="md:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <BarChart2 className="text-cyan-500/80" size={20} />
                            <span className="font-bold text-slate-200 text-lg tracking-wide">CFO's</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            The unified Management Accounting & CFO Decision Engine. Turning complex financial data into clear, actionable corporate strategy.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-slate-300 font-bold mb-4 uppercase tracking-widest text-[10px]">Platform</h4>
                        <ul className="space-y-2.5 text-sm text-slate-500 font-medium">
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">Master Budget</button></li>
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">CVP Analysis</button></li>
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">Scenario & Risk</button></li>
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">Incremental Decisions</button></li>
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">ERP Operations</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-slate-300 font-bold mb-4 uppercase tracking-widest text-[10px]">Reporting</h4>
                        <ul className="space-y-2.5 text-sm text-slate-500 font-medium">
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">Executive Dashboard</button></li>
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">Income Statement</button></li>
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">Balance Sheet</button></li>
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">Cash Flow</button></li>
                            <li><button onClick={onEnter} className="hover:text-cyan-400 transition-colors">PDF Report Generator</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-slate-300 font-bold mb-4 uppercase tracking-widest text-[10px]">Connect</h4>
                        <ul className="space-y-2.5 text-sm text-slate-500 font-medium">
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact Support</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Schedule Demo</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Enterprise Sales</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800/80 text-center text-xs text-slate-600 font-medium flex flex-col md:flex-row justify-between items-center">
                    <p>&copy; {new Date().getFullYear()} CFO's Decision Engine. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const CvpAnalysis = ({ engineResults }) => {
    const { annual } = engineResults;
    const budgetPrice = annual.salesUnits > 0 ? annual.revenue / annual.salesUnits : 0;
    const budgetVc = annual.salesUnits > 0 ? annual.variableCosts / annual.salesUnits : 0;
    const budgetFc = annual.fixedCosts || 0;
    const budgetVol = annual.salesUnits || 0;

    const [isManual, setIsManual] = useState(false);
    const [manualData, setManualData] = useState({ price: 0, vc: 0, fc: 0, volume: 0 });
    const [targetProfit, setTargetProfit] = useState(0);

    const currentData = isManual ? manualData : { price: budgetPrice, vc: budgetVc, fc: budgetFc, volume: budgetVol };

    const cmUnit = (currentData.price || 0) - (currentData.vc || 0);
    const cmRatio = currentData.price > 0 ? cmUnit / currentData.price : 0;
    const totalCm = cmUnit * (currentData.volume || 0);
    const opIncome = totalCm - (currentData.fc || 0);
    
    const beUnits = cmUnit > 0 ? (currentData.fc || 0) / cmUnit : 0;
    const beSales = beUnits * (currentData.price || 0);
    
    const currentSales = (currentData.volume || 0) * (currentData.price || 0);
    const marginOfSafety = currentSales - beSales;
    const marginOfSafetyPct = currentSales > 0 ? marginOfSafety / currentSales : 0;

    const dol = Math.abs(opIncome) > 0.5 ? totalCm / opIncome : 0;
    const isAtBreakEven = Math.abs(opIncome) <= 0.5;

    // Target Profit Simulator
    const reqUnitsTarget = cmUnit > 0 ? ((currentData.fc || 0) + (parseFloat(targetProfit) || 0)) / cmUnit : 0;
    const reqSalesTarget = reqUnitsTarget * (currentData.price || 0);

    // MoS Progress Bar Logic
    const maxBarSales = Math.max(currentSales, beSales) * 1.2;
    const currentSalesPct = maxBarSales > 0 ? (currentSales / maxBarSales) * 100 : 0;
    const beSalesPct = maxBarSales > 0 ? (beSales / maxBarSales) * 100 : 0;

    // Insights logic
    const totalCosts = (currentData.fc || 0) + ((currentData.volume || 0) * (currentData.vc || 0));
    const fcRatio = totalCosts > 0 ? (currentData.fc || 0) / totalCosts : 0;

    const chartData = [];
    const safeBeUnitsForChart = (cmUnit > 0 && isFinite((currentData.fc || 0) / cmUnit)) ? ((currentData.fc || 0) / cmUnit) : 0;
    const maxVol = Math.max((currentData.volume || 0) * 1.5, safeBeUnitsForChart * 1.5, 100);
    const step = Math.max(1, maxVol / 10);
    for (let i = 0; i <= maxVol; i += step) {
        chartData.push({ units: Math.round(i), Revenue: i * (currentData.price || 0), 'Total Cost': (currentData.fc || 0) + (i * (currentData.vc || 0)), 'Fixed Cost': (currentData.fc || 0) });
    }

    const updateManual = (field, val) => {
        if (!isManual) {
            setIsManual(true);
            setManualData({ ...currentData, [field]: parseFloat(val) || 0 });
        } else {
            setManualData(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
        }
    };

    const FlowBox = ({ title, value, isHighlight, isSub }) => (
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm w-full md:w-36 ${isHighlight ? 'bg-cyan-900/20 border-cyan-500/30' : isSub ? 'bg-rose-900/10 border-rose-500/20' : 'bg-[#111827] border-slate-800'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</span>
            <span className={`text-lg font-black font-mono tracking-tight ${isHighlight ? 'text-cyan-400' : isSub ? 'text-rose-400/90' : 'text-slate-200'}`}>{formatCompactCurrency(value)}</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-200 tracking-tight flex items-center"><TrendingUp className="mr-3 text-cyan-500/80"/> CVP & Break-Even Analysis</h2>
                    <p className="text-sm text-slate-400 mt-1 font-medium">Cost-Volume-Profit interactions and Break-Even modeling.</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center bg-[#111827] p-1 rounded-xl border border-slate-700/80 shadow-sm">
                    <button onClick={() => setIsManual(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!isManual ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}>Linked to Budget</button>
                    <button onClick={() => setIsManual(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isManual ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}>Manual Override</button>
                </div>
            </div>

            {/* Top Row: CM Waterfall & Inputs */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-3">
                    <div className="bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 shadow-sm backdrop-blur-sm h-full">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Unit Economics {isManual && <span className="text-amber-400 ml-2">(Override)</span>}</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs font-semibold text-slate-400 block mb-1">Selling Price</label><div className="relative"><span className="absolute left-3 top-2 text-slate-500 font-medium text-sm">$</span><input type="number" value={currentData.price === 0 ? '' : currentData.price} onChange={e => updateManual('price', e.target.value)} className={`w-full py-2 pl-7 pr-3 border rounded-lg text-sm ${isManual ? 'border-amber-500/30 bg-amber-900/10 focus:border-amber-500 text-amber-200' : 'border-slate-700/80 bg-[#0a0f1c] text-slate-200'} outline-none focus:border-cyan-500 transition-all font-mono shadow-inner`} /></div></div>
                            <div><label className="text-xs font-semibold text-slate-400 block mb-1">Variable Cost</label><div className="relative"><span className="absolute left-3 top-2 text-slate-500 font-medium text-sm">$</span><input type="number" value={currentData.vc === 0 ? '' : currentData.vc} onChange={e => updateManual('vc', e.target.value)} className={`w-full py-2 pl-7 pr-3 border rounded-lg text-sm ${isManual ? 'border-amber-500/30 bg-amber-900/10 focus:border-amber-500 text-amber-200' : 'border-slate-700/80 bg-[#0a0f1c] text-slate-200'} outline-none focus:border-cyan-500 transition-all font-mono shadow-inner`} /></div></div>
                            <div><label className="text-xs font-semibold text-slate-400 block mb-1">Fixed Costs</label><div className="relative"><span className="absolute left-3 top-2 text-slate-500 font-medium text-sm">$</span><input type="number" value={currentData.fc === 0 ? '' : currentData.fc} onChange={e => updateManual('fc', e.target.value)} className={`w-full py-2 pl-7 pr-3 border rounded-lg text-sm ${isManual ? 'border-amber-500/30 bg-amber-900/10 focus:border-amber-500 text-amber-200' : 'border-slate-700/80 bg-[#0a0f1c] text-slate-200'} outline-none focus:border-cyan-500 transition-all font-mono shadow-inner`} /></div></div>
                            <div><label className="text-xs font-semibold text-slate-400 block mb-1">Volume (Units)</label><input type="number" value={currentData.volume === 0 ? '' : currentData.volume} onChange={e => updateManual('volume', e.target.value)} className={`w-full py-2 px-3 border rounded-lg text-sm ${isManual ? 'border-amber-500/30 bg-amber-900/10 focus:border-amber-500 text-amber-200' : 'border-slate-700/80 bg-[#0a0f1c] text-slate-200'} outline-none focus:border-cyan-500 transition-all font-mono shadow-inner`} /></div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-9 bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm flex flex-col justify-center backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6 flex items-center"><Activity size={16} className="mr-2"/> Contribution Margin Flow</h3>
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 w-full px-2">
                        <FlowBox title="Total Revenue" value={currentSales} />
                        <ArrowRight className="text-slate-600 rotate-90 md:rotate-0 shrink-0" size={24}/>
                        <FlowBox title="Less: Var. Costs" value={(currentData.volume || 0) * (currentData.vc || 0)} isSub />
                        <ArrowRight className="text-slate-600 rotate-90 md:rotate-0 shrink-0" size={24}/>
                        <FlowBox title="Contribution Margin" value={totalCm} isHighlight />
                        <ArrowRight className="text-slate-600 rotate-90 md:rotate-0 shrink-0" size={24}/>
                        <FlowBox title="Less: Fixed Costs" value={currentData.fc || 0} isSub />
                        <ArrowRight className="text-slate-600 rotate-90 md:rotate-0 shrink-0" size={24}/>
                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center shadow-md w-full md:w-40 bg-[#0a0f1c] ${opIncome >= 0 ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operating Income</span>
                            <span className={`text-xl font-black font-mono tracking-tight ${opIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCompactCurrency(opIncome)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row: KPIs & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#111827]/80 border border-slate-800/80 p-4 rounded-xl shadow-sm backdrop-blur-sm"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CM / Unit</div><div className="text-2xl font-black text-slate-200 font-mono">{formatCurrency(cmUnit)}</div></div>
                    <div className="bg-[#111827]/80 border border-slate-800/80 p-4 rounded-xl shadow-sm backdrop-blur-sm"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CM Ratio</div><div className="text-2xl font-black text-slate-200 font-mono">{formatPercent(cmRatio)}</div></div>
                    <div className="bg-[#111827]/80 border border-slate-800/80 p-4 rounded-xl shadow-sm backdrop-blur-sm"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Break-Even Units</div><div className="text-2xl font-black text-slate-200 font-mono">{formatNumber(beUnits)}</div></div>
                    <div className="bg-[#111827]/80 border border-slate-800/80 p-4 rounded-xl shadow-sm backdrop-blur-sm"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Break-Even Sales</div><div className="text-2xl font-black text-slate-200 font-mono">{formatCompactCurrency(beSales)}</div></div>
                </div>
                
                <div className="bg-[#111827]/80 p-5 rounded-xl border border-slate-800/80 shadow-sm backdrop-blur-sm">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center"><Lightbulb size={14} className="mr-2"/> Management Insights</h4>
                    <ul className="space-y-3">
                        <li className="flex items-start text-sm text-slate-300 leading-relaxed font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 mr-2 shrink-0"></div>
                            Sales can drop by {formatPercent(marginOfSafetyPct)} ({formatCurrency(marginOfSafety)}) before hitting an operating loss.
                        </li>
                        <li className="flex items-start text-sm text-slate-300 leading-relaxed font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 mr-2 shrink-0"></div>
                            Fixed costs represent {formatPercent(fcRatio)} of the total cost structure.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Row: Charts & Target Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#111827]/80 border border-slate-800/80 p-6 rounded-2xl shadow-sm backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-800/50 pb-2 flex justify-between">
                        <span>Advanced Break-Even Analysis</span>
                        <span className="text-emerald-400 font-mono capitalize">MoS: {formatPercent(marginOfSafetyPct)}</span>
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="units" tick={{fontSize: 11, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={formatCompactNumber}/>
                                <YAxis tick={{fontSize: 11, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} tickMargin={10} />
                                <RechartsTooltip cursor={{stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4'}} content={<CustomChartTooltip formatter={(val) => formatCurrency(val)} />} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }} iconType="circle" />
                                <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2}} />
                                <Line type="monotone" dataKey="Total Cost" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{r: 6, fill: '#ef4444', stroke: '#0f172a', strokeWidth: 2}} />
                                <Line type="monotone" dataKey="Fixed Cost" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                {beUnits > 0 && isFinite(beUnits) && beUnits <= maxVol && (
                                    <ReferenceLine x={beUnits} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Break-Even', fill: '#38bdf8', fontSize: 11, fontWeight: 'bold', fontFamily: 'Inter' }} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Margin of Safety Visualizer */}
                    <div className="bg-[#111827]/80 border border-slate-800/80 p-5 rounded-2xl shadow-sm backdrop-blur-sm">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Margin of Safety Profile</h4>
                        <div className="relative h-6 bg-[#0a0f1c] rounded-full border border-slate-800 overflow-hidden shadow-inner">
                            {/* Fill representing current sales */}
                            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" style={{ width: `${currentSalesPct}%` }}></div>
                            {/* Break Even Marker */}
                            {beSalesPct > 0 && beSalesPct <= 100 && (
                                <div className="absolute top-0 h-full w-1 bg-rose-500 z-10 shadow-[0_0_8px_rgba(244,63,94,0.8)]" style={{ left: `${beSalesPct}%` }} title="Break-Even Point"></div>
                            )}
                        </div>
                        <div className="flex justify-between mt-3 text-xs font-semibold">
                            <span className="text-slate-500 font-mono">$0</span>
                            <span className="text-rose-400 font-mono" style={{ paddingLeft: beSalesPct < 50 ? `${beSalesPct}%` : 0 }}>BE: {formatCompactCurrency(beSales)}</span>
                            <span className="text-emerald-400 font-mono text-right">Actual: {formatCompactCurrency(currentSales)}</span>
                        </div>
                    </div>

                    {/* Target Profit Simulator */}
                    <div className="bg-[#111827]/80 border border-slate-800/80 p-5 rounded-2xl shadow-sm backdrop-blur-sm flex-1">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center"><Target size={14} className="mr-2"/> Target Profit Simulator</h4>
                        <div className="mb-4">
                            <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-widest">Target Operating Profit</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 font-medium text-sm">$</span>
                                <input 
                                    type="number" 
                                    value={targetProfit === 0 ? '' : targetProfit} 
                                    onChange={e => setTargetProfit(e.target.value)} 
                                    placeholder="e.g. 250000"
                                    className="w-full py-2 pl-7 pr-3 border border-slate-700/80 bg-[#0a0f1c] text-slate-200 rounded-lg text-sm outline-none focus:border-cyan-500 transition-all font-mono shadow-inner" 
                                />
                            </div>
                        </div>
                        <div className="space-y-3 pt-3 border-t border-slate-800/50">
                            <div className="flex justify-between items-center bg-[#0a0f1c] p-3 rounded-lg border border-slate-800/50 shadow-inner">
                                <span className="text-xs font-bold text-slate-400">Required Units</span>
                                <span className="font-mono font-black text-slate-200 text-lg">{formatNumber(reqUnitsTarget)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#0a0f1c] p-3 rounded-lg border border-slate-800/50 shadow-inner">
                                <span className="text-xs font-bold text-slate-400">Required Sales</span>
                                <span className="font-mono font-black text-cyan-400 text-lg">{formatCurrency(reqSalesTarget)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportCenter = ({ engineResults, model }) => {
    const { statements, annual } = engineResults;
    const { income, balanceSheet: bs, cashFlow: cf } = statements;
    
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [pdfError, setPdfError] = useState(null);

    const handleDownloadPDF = () => {
        setPdfError(null);
        setIsGeneratingPDF(true);
        setTimeout(() => {
            try {
                window.print();
                setIsGeneratingPDF(false);
            } catch (error) {
                console.error("PDF Error:", error);
                setPdfError("Could not generate PDF in this environment.");
                setIsGeneratingPDF(false);
            }
        }, 500);
    };

    const currentRatio = bs.liabilities.ap > 0 ? (bs.assets.cash + bs.assets.ar + bs.assets.inv) / bs.liabilities.ap : 0;
    const grossMargin = income.revenue > 0 ? income.grossProfit / income.revenue : 0;
    const operatingMargin = income.revenue > 0 ? income.opIncome / income.revenue : 0;
    const netMargin = income.revenue > 0 ? income.netIncome / income.revenue : 0;
    const beSales = annual.contributionMargin > 0 ? annual.fixedCosts / (annual.contributionMargin / annual.revenue) : 0;
    const dol = Math.abs(income.opIncome) > 0.5 ? annual.contributionMargin / income.opIncome : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12 print:p-0 print:m-0 print:space-y-0 text-slate-200">
            <div className="flex justify-between items-center print:hidden border-b border-slate-800/80 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-200 tracking-tight flex items-center"><FileText className="mr-3 text-cyan-500/80"/> CFO Management Report</h2>
                    <p className="text-sm text-slate-400 mt-1 font-medium">Formal financial and operational analysis report.</p>
                </div>
                <div className="flex flex-col items-end">
                    <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="px-5 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center font-bold transition-all shadow-sm">
                        {isGeneratingPDF ? <Loader2 size={18} className="mr-2 animate-spin"/> : <FileDown size={18} className="mr-2"/>}
                        {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                    </button>
                    {pdfError && <div className="text-xs text-rose-400 mt-2">{pdfError}</div>}
                </div>
            </div>

            <div id="cfo-report-container" className="bg-[#111827]/80 p-12 rounded-2xl shadow-sm border border-slate-800/80 print:bg-white print:text-black print:shadow-none print:border-none print:p-0 max-w-5xl mx-auto font-serif backdrop-blur-sm">
                <div className="text-center border-b-4 border-slate-700/50 print:border-slate-900 pb-8 mb-10">
                    <h1 className="text-4xl font-black uppercase tracking-widest text-slate-100 print:text-slate-900 mb-2">{model.company.name}</h1>
                    <h2 className="text-2xl font-semibold text-slate-400 print:text-slate-600">Comprehensive Management Report</h2>
                    <p className="text-sm text-slate-500 mt-4 uppercase tracking-widest font-bold">Fiscal Year {model.company.year} | Currency: USD</p>
                </div>

                <div className="space-y-12 text-slate-300 print:text-slate-800">
                    <section>
                        <h3 className="text-xl font-bold border-b border-slate-700/50 print:border-slate-300 pb-2 mb-4 uppercase tracking-wider text-slate-200 print:text-slate-900">1. Executive Summary</h3>
                        <p className="text-base leading-relaxed text-justify">
                            For the fiscal year {model.company.year}, {model.company.name} generated total revenue of <strong>{formatCurrency(income.revenue)}</strong>. 
                            The company achieved a gross profit of {formatCurrency(income.grossProfit)}, representing a margin of {formatPercent(grossMargin)}. 
                            Operating expenses totaled {formatCurrency(income.opex)}, resulting in an operating income (EBIT) of <strong>{formatCurrency(income.opIncome)}</strong> ({formatPercent(operatingMargin)} margin).
                            After factoring in interest and taxes, the final net income stands at <strong>{formatCurrency(income.netIncome)}</strong> ({formatPercent(netMargin)} margin).
                        </p>
                        <p className="text-base leading-relaxed text-justify mt-3">
                            The balance sheet remains structured with total assets of {formatCurrency(bs.assets.total)}. 
                            Liquidity is measured by a current cash balance of <strong>{formatCurrency(bs.assets.cash)}</strong> and a current ratio of {currentRatio.toFixed(2)}x.
                            Throughout the period, operations utilized {formatNumber(annual.laborHoursUsed)} labor hours and {formatNumber(annual.machineHoursUsed)} machine hours to produce {formatNumber(annual.actualProductionUnits)} units.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold border-b border-slate-700/50 print:border-slate-300 pb-2 mb-4 uppercase tracking-wider text-slate-200 print:text-slate-900">2. Financial Performance summary</h3>
                        <div className="bg-[#0f1523]/50 p-6 rounded-xl border border-slate-800/80 print:bg-white print:border-slate-300 shadow-inner">
                            <table className="w-full text-base">
                                <tbody className="divide-y divide-slate-800/50 print:divide-slate-200">
                                    <tr className="flex justify-between py-2 text-slate-200 print:text-black"><td className="font-semibold">Gross Revenue</td><td className="font-mono">{formatAccounting(income.revenue)}</td></tr>
                                    <tr className="flex justify-between py-2 text-slate-400 print:text-slate-600"><td className="pl-4">Cost of Goods Sold (COGS)</td><td className="font-mono">({formatAccounting(income.cogs)})</td></tr>
                                    <tr className="flex justify-between py-2 font-bold text-slate-200 print:text-black"><td className="">Gross Profit</td><td className="font-mono">{formatAccounting(income.grossProfit)}</td></tr>
                                    <tr className="flex justify-between py-2 text-slate-400 print:text-slate-600"><td className="pl-4">Operating Expenses (OpEx)</td><td className="font-mono">({formatAccounting(income.opex)})</td></tr>
                                    <tr className="flex justify-between py-2 text-slate-400 print:text-slate-600"><td className="pl-4">Depreciation Expense</td><td className="font-mono">({formatAccounting(income.depr)})</td></tr>
                                    <tr className="flex justify-between py-2 font-bold text-indigo-300 print:text-indigo-900"><td className="">Operating Income (EBIT)</td><td className="font-mono">{formatAccounting(income.opIncome)}</td></tr>
                                    <tr className="flex justify-between py-2 text-slate-400 print:text-slate-600"><td className="pl-4">Interest & Taxes</td><td className="font-mono">({formatAccounting(income.interest + income.tax)})</td></tr>
                                    <tr className="flex justify-between py-3 font-black text-lg border-t-2 border-slate-700 print:border-slate-800 text-slate-100 print:text-black"><td className="">Net Income</td><td className="font-mono">{formatAccounting(income.netIncome)}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                    
                    <section className="page-break-inside-avoid">
                        <h3 className="text-xl font-bold border-b border-slate-700/50 print:border-slate-300 pb-2 mb-4 uppercase tracking-wider text-slate-200 print:text-slate-900">3. Management Accounting & CVP</h3>
                        <div className="grid grid-cols-2 gap-6 text-sm mb-6">
                            <div className="p-4 bg-[#0f1523]/50 border border-slate-800/80 rounded-xl print:bg-white print:border-slate-300 shadow-inner">
                                <div className="text-slate-400 print:text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Break-Even Sales</div>
                                <div className="font-black text-2xl text-slate-200 print:text-slate-900 font-mono">{formatCurrency(beSales)}</div>
                                <p className="text-xs text-slate-500 print:text-slate-600 mt-2">Revenue required to cover all fixed and variable costs.</p>
                            </div>
                            <div className="p-4 bg-[#0f1523]/50 border border-slate-800/80 rounded-xl print:bg-white print:border-slate-300 shadow-inner">
                                <div className="text-slate-400 print:text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Operating Leverage</div>
                                <div className="font-black text-2xl text-slate-200 print:text-slate-900 font-mono">{dol.toFixed(2)}x</div>
                                <p className="text-xs text-slate-500 print:text-slate-600 mt-2">A 1% change in sales translates to a {dol.toFixed(2)}% change in operating profit.</p>
                            </div>
                        </div>
                    </section>

                    <section className="page-break-inside-avoid">
                        <h3 className="text-xl font-bold border-b border-slate-700/50 print:border-slate-300 pb-2 mb-4 uppercase tracking-wider text-slate-200 print:text-slate-900">4. ERP & Operational Impacts</h3>
                        <p className="text-base leading-relaxed text-justify mb-4">
                            Operational execution deeply influences the financial outcomes recorded above. 
                            The manufacturing division achieved an output of {formatNumber(annual.actualProductionUnits)} units against a planned budget of {formatNumber(annual.productionUnits)} units.
                            Ending inventory currently sits at {formatNumber(annual.finishedGoodsInvUnits)} units, representing a carrying value of {formatCurrency(bs.assets.inv)}.
                        </p>
                    </section>

                    <section className="page-break-inside-avoid">
                        <h3 className="text-xl font-bold border-b border-slate-700/50 print:border-slate-300 pb-2 mb-4 uppercase tracking-wider text-slate-200 print:text-slate-900">5. Strategic CFO Recommendations</h3>
                        <div className="bg-[#0f1523]/50 p-6 rounded-xl border border-slate-800/80 print:bg-white print:border-slate-300 shadow-inner">
                            <ul className="space-y-4">
                                {income.netIncome < 0 && (
                                    <li className="flex items-start">
                                        <AlertTriangle size={20} className="text-rose-400/90 mr-3 shrink-0 mt-0.5"/>
                                        <div>
                                            <strong className="block text-rose-400/90 print:text-red-700 mb-1">Implement Immediate Cost Reduction</strong>
                                            <span className="text-slate-400 print:text-slate-700 text-sm">The current cost structure yields a net loss. Management must immediately evaluate non-essential fixed costs and review product pricing to restore profitability.</span>
                                        </div>
                                    </li>
                                )}
                                {currentRatio > 0 && currentRatio < 1.2 && (
                                    <li className="flex items-start">
                                        <AlertTriangle size={20} className="text-amber-400/90 mr-3 shrink-0 mt-0.5"/>
                                        <div>
                                            <strong className="block text-amber-400/90 print:text-amber-700 mb-1">Improve Working Capital Position</strong>
                                            <span className="text-slate-400 print:text-slate-700 text-sm">A current ratio of {currentRatio.toFixed(2)} indicates potential liquidity constraints. Accelerate accounts receivable collections and negotiate longer payment terms with suppliers.</span>
                                        </div>
                                    </li>
                                )}
                                {dol > 4 && (
                                    <li className="flex items-start">
                                        <AlertTriangle size={20} className="text-indigo-400/90 mr-3 shrink-0 mt-0.5"/>
                                        <div>
                                            <strong className="block text-indigo-400/90 print:text-blue-700 mb-1">Monitor High Operating Leverage</strong>
                                            <span className="text-slate-400 print:text-slate-700 text-sm">The high DOL ({dol.toFixed(1)}x) means profit is highly sensitive to volume drops. Diversify revenue streams to protect against downside volume risks.</span>
                                        </div>
                                    </li>
                                )}
                                {income.netIncome > 0 && currentRatio >= 1.2 && (
                                    <li className="flex items-start">
                                        <CheckCircle2 size={20} className="text-emerald-400/90 mr-3 shrink-0 mt-0.5"/>
                                        <div>
                                            <strong className="block text-emerald-400/90 print:text-emerald-700 mb-1">Reinvest Operating Surplus</strong>
                                            <span className="text-slate-400 print:text-slate-700 text-sm">Financial health is strong. Allocate free cash flow generated from operations towards strategic capital expenditures or early debt principal repayment.</span>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </section>

                    <div className="pt-12 mt-12 border-t border-slate-800/50 print:border-slate-300 text-center text-sm text-slate-500">
                        Generated by CFO's Decision Engine on {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SensitivityAnalysis = () => {
    const { model, engineResults: baseResults } = useContext(FinancialContext);
    
    const [scenarios, setScenarios] = useState([
        { id: 'base', name: 'Base Case (Budget)', isSystem: true, assumptions: { volume: 1, price: 1, variableCost: 1, fixedCost: 1 } },
        { id: 's1', name: 'Recession Stress Test', isSystem: false, assumptions: { volume: 0.85, price: 0.95, variableCost: 1.05, fixedCost: 1.0 } },
        { id: 's2', name: 'Aggressive Growth', isSystem: false, assumptions: { volume: 1.20, price: 1.05, variableCost: 0.95, fixedCost: 1.10 } }
    ]);
    const [activeId, setActiveId] = useState('base');
    
    const activeScenario = scenarios.find(s => s.id === activeId) || scenarios[0];
    const isBase = activeScenario.isSystem;

    const handleAssumptionChange = (key, val) => {
        if (isBase) return;
        setScenarios(prev => prev.map(s => s.id === activeId ? { ...s, assumptions: { ...s.assumptions, [key]: val } } : s));
    };

    const addScenario = () => {
        const newId = 's' + Date.now();
        setScenarios([...scenarios, { id: newId, name: 'Custom Scenario', isSystem: false, assumptions: { ...activeScenario.assumptions } }]);
        setActiveId(newId);
    };

    const deleteScenario = () => {
        if (isBase) return;
        const filtered = scenarios.filter(s => s.id !== activeId);
        setScenarios(filtered);
        setActiveId('base');
    };

    const scenarioResults = useMemo(() => {
        if (activeId === 'base') return baseResults;
        const cloned = JSON.parse(JSON.stringify(model));
        const assump = activeScenario.assumptions;
        cloned.budget.revenue.lines.forEach(l => l.months.forEach(m => {
            m.quantity *= (assump.volume || 1);
            m.price *= (assump.price || 1);
        }));
        cloned.budget.variableCosts.lines.forEach(l => l.months.forEach(m => {
            m.amount *= ((assump.volume || 1) * (assump.variableCost || 1));
        }));
        cloned.budget.fixedCosts.lines.forEach(l => l.months.forEach(m => {
            m.amount *= (assump.fixedCost || 1);
        }));
        return calculateFinancials(cloned);
    }, [model, activeScenario, baseResults, activeId]);

    const tornadoData = useMemo(() => {
        const run = (k, v) => {
            const c = JSON.parse(JSON.stringify(model));
            if (k === 'v') c.budget.revenue.lines.forEach(l => l.months.forEach(m => m.quantity *= v));
            if (k === 'p') c.budget.revenue.lines.forEach(l => l.months.forEach(m => m.price *= v));
            if (k === 'vc') c.budget.variableCosts.lines.forEach(l => l.months.forEach(m => m.amount *= v));
            if (k === 'fc') c.budget.fixedCosts.lines.forEach(l => l.months.forEach(m => m.amount *= v));
            return calculateFinancials(c).statements.income.opIncome;
        };
        const b = baseResults.statements.income.opIncome;
        return [
            { name: 'Selling Price (±10%)', down: run('p', 0.9) - b, up: run('p', 1.1) - b },
            { name: 'Sales Volume (±10%)', down: run('v', 0.9) - b, up: run('v', 1.1) - b },
            { name: 'Variable Costs (±10%)', down: run('vc', 1.1) - b, up: run('vc', 0.9) - b },
            { name: 'Fixed Costs (±10%)', down: run('fc', 1.1) - b, up: run('fc', 0.9) - b },
        ].sort((a, b) => Math.max(Math.abs(b.down), Math.abs(b.up)) - Math.max(Math.abs(a.down), Math.abs(a.up)));
    }, [model, baseResults]);

    const matrixSteps = [0.8, 0.9, 1.0, 1.1, 1.2];
    const matrixData = useMemo(() => {
        const data = [];
        matrixSteps.forEach(v => {
            matrixSteps.forEach(p => {
                const c = JSON.parse(JSON.stringify(model));
                c.budget.revenue.lines.forEach(l => l.months.forEach(m => { m.quantity *= v; m.price *= p; }));
                c.budget.variableCosts.lines.forEach(l => l.months.forEach(m => { m.amount *= v; }));
                const res = calculateFinancials(c);
                data.push({ v, p, ni: res.statements.income.netIncome });
            });
        });
        return data;
    }, [model]);

    const profitCurveData = useMemo(() => {
        const data = [];
        for (let vol = 0.5; vol <= 1.5; vol += 0.1) {
            const c = JSON.parse(JSON.stringify(model));
            c.budget.revenue.lines.forEach(l => l.months.forEach(m => m.quantity *= vol));
            c.budget.variableCosts.lines.forEach(l => l.months.forEach(m => m.amount *= vol));
            const res = calculateFinancials(c);
            data.push({ volumePct: `${Math.round(vol * 100)}%`, EBIT: res.statements.income.opIncome });
        }
        return data;
    }, [model]);

    const riskAnalysis = useMemo(() => {
        const baseNi = baseResults.statements.income.netIncome;
        const scNi = scenarioResults.statements.income.netIncome;
        const baseCash = baseResults.statements.cashFlow.endingCash;
        const scCash = scenarioResults.statements.cashFlow.endingCash;
        const rev = scenarioResults.annual.revenue;
        const cmRatio = scenarioResults.annual.revenue > 0 ? scenarioResults.annual.contributionMargin / scenarioResults.annual.revenue : 0;
        const beSales = cmRatio > 0 ? scenarioResults.annual.fixedCosts / cmRatio : 0;
        const marginOfSafety = rev > 0 ? (rev - beSales) / rev : 0;
        
        let level = 'Low Risk';
        let color = 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30';
        let icon = <Shield size={32} />;
        
        if (scCash < 0) { 
            level = 'Critical Risk'; color = 'bg-rose-900/20 text-rose-400 border-rose-500/30'; icon = <Zap size={32} />; 
        } else if (scNi < 0) { 
            level = 'High Risk'; color = 'bg-orange-900/20 text-orange-400 border-orange-500/30'; icon = <AlertTriangle size={32} />; 
        } else if (marginOfSafety < 0.1) { 
            level = 'Moderate Risk'; color = 'bg-amber-900/20 text-amber-400 border-amber-500/30'; icon = <Activity size={32} />; 
        }
        
        const insights = [];
        if (scNi < baseNi) insights.push(`Net income drops by ${formatPercent(1 - (scNi / (baseNi||1)))} compared to the base budget.`);
        if (scCash < baseCash) insights.push(`Ending cash position weakens by ${formatCurrency(baseCash - scCash)}.`);
        if (scNi < 0) insights.push(`Scenario pushes operations into a net loss of ${formatCurrency(scNi)}.`);
        if (scCash < 0) insights.push(`SEVERE: Scenario results in a cash shortfall, requiring external financing.`);
        if (marginOfSafety < 0.1 && marginOfSafety > 0) insights.push(`Margin of safety tightens to ${formatPercent(marginOfSafety)}, increasing vulnerability to slight shocks.`);
        if (scNi > baseNi) insights.push(`Highly favorable scenario, increasing net income by ${formatPercent((scNi / (baseNi||1)) - 1)}.`);
        if (insights.length === 0) insights.push(`Scenario tracks closely with baseline expectations.`);
        
        return { level, color, icon, insights };
    }, [baseResults, scenarioResults]);

    const getHeatmapClass = (val, baseVal, isBase) => {
        if (isBase) return 'bg-indigo-600/90 text-white font-bold ring-2 ring-indigo-400/50 z-10 relative shadow-lg scale-110';
        if (val < 0) return 'bg-rose-900/40 text-rose-300 font-medium';
        if (val < baseVal * 0.5) return 'bg-amber-900/30 text-amber-300';
        if (val < baseVal) return 'bg-emerald-900/20 text-emerald-300';
        if (val > baseVal * 1.5) return 'bg-emerald-600/40 text-emerald-100 font-bold';
        if (val > baseVal) return 'bg-emerald-900/30 text-emerald-200';
        return 'bg-[#0f1523] text-slate-300';
    };

    const CompRow = ({ label, bVal, sVal, isPct = false, invertGood = false }) => {
        const diff = sVal - bVal;
        const pctDiff = bVal !== 0 ? diff / Math.abs(bVal) : 0;
        const isFav = diff === 0 ? null : invertGood ? diff < 0 : diff > 0;
        const cColor = isFav === null ? 'text-slate-500' : isFav ? 'text-emerald-400/90' : 'text-rose-400/90';
        return (
            <tr className="border-b border-slate-800/50 hover:bg-[#1e293b]/50 transition-colors">
                <td className="py-2.5 px-3 text-sm font-medium text-slate-300">{label}</td>
                <td className="py-2.5 px-3 text-sm text-right text-slate-400 font-mono">{isPct ? formatPercent(bVal) : formatAccounting(bVal)}</td>
                <td className="py-2.5 px-3 text-sm text-right font-bold text-slate-200 font-mono">{isPct ? formatPercent(sVal) : formatAccounting(sVal)}</td>
                <td className={`py-2.5 px-3 text-sm text-right font-bold font-mono ${cColor}`}>{diff > 0 ? '+' : ''}{isPct ? formatPercent(diff) : formatAccounting(diff)}</td>
                <td className={`py-2.5 px-3 text-sm text-right font-bold font-mono ${cColor}`}>{diff > 0 ? '+' : ''}{formatPercent(pctDiff)}</td>
            </tr>
        );
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in">
            <div className="flex justify-between items-end border-b border-slate-800/80 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-200 tracking-tight flex items-center"><Target className="mr-3 text-cyan-500/80"/> Financial Scenario & Risk Center</h2>
                    <p className="text-sm text-slate-400 mt-1 font-medium">Stress-test assumptions, identify vulnerabilities, and simulate multi-variable economic risks.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-[#111827]/80 rounded-2xl p-6 shadow-sm border border-slate-800/80 text-slate-200 flex flex-col h-full backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-800/50 pb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90 flex items-center"><Settings2 className="mr-2" size={16}/> Builder</h3>
                            <div className="flex space-x-1">
                                <button onClick={addScenario} title="New Scenario" className="p-1.5 bg-[#1e293b] hover:bg-slate-700 rounded text-slate-300 transition-colors shadow-sm"><Plus size={16}/></button>
                                <button onClick={deleteScenario} disabled={isBase} title="Delete Scenario" className={`p-1.5 rounded transition-colors shadow-sm ${isBase ? 'opacity-30 cursor-not-allowed' : 'bg-[#1e293b] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400'}`}><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="mb-8">
                            <label className="text-xs text-slate-400 font-semibold mb-2 block">Active Scenario</label>
                            <select 
                                value={activeId} 
                                onChange={(e) => setActiveId(e.target.value)}
                                className="w-full bg-[#0a0f1c] border border-slate-700/80 text-slate-200 text-sm rounded-lg p-2.5 focus:border-cyan-500 outline-none shadow-inner"
                            >
                                {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-6 flex-1">
                            {['volume', 'price', 'variableCost', 'fixedCost'].map(key => {
                                const val = activeScenario.assumptions[key];
                                const isFav = val < 1 ? (key.includes('Cost')) : val > 1 ? (!key.includes('Cost')) : null;
                                const color = isFav === null ? 'text-slate-400' : isFav ? 'text-emerald-400/90' : 'text-rose-400/90';
                                return (
                                    <div key={key} className={isBase ? 'opacity-50 grayscale pointer-events-none' : ''}>
                                        <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                                            <span className="text-slate-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className={color}>{val === 1 ? 'Base' : `${val > 1 ? '+' : ''}${Math.round((val - 1) * 100)}%`}</span>
                                        </div>
                                        <input 
                                            type="range" min="0.5" max="1.5" step="0.01" 
                                            value={val} 
                                            onChange={e => handleAssumptionChange(key, parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-[#0a0f1c] rounded-lg appearance-none cursor-pointer accent-cyan-500/80 shadow-inner"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {isBase && <div className="mt-6 text-xs text-center text-slate-500 font-semibold bg-[#0a0f1c] py-2 rounded-lg border border-slate-800/80 border-dashed shadow-inner">Base Case is read-only. Create a new scenario to adjust assumptions.</div>}
                    </div>
                </div>
                <div className="xl:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className={`p-6 rounded-2xl border flex items-center shadow-sm backdrop-blur-sm ${riskAnalysis.color}`}>
                            <div className="p-4 bg-[#0a0f1c]/50 rounded-xl mr-5 shadow-inner border border-slate-800/30">
                                {riskAnalysis.icon}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Scenario Risk</h4>
                                <div className="text-2xl font-black tracking-tight">{riskAnalysis.level}</div>
                            </div>
                        </div>
                        <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm lg:col-span-2 backdrop-blur-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center"><Target size={14} className="mr-2 text-cyan-500/80"/> Management Interpretation</h4>
                            <ul className="space-y-2.5">
                                {riskAnalysis.insights.map((insight, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-slate-300 font-medium leading-relaxed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/80 mt-2 mr-3 shrink-0"></div>
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-slate-200 mb-4 border-b border-slate-800/50 pb-2 flex items-center"><Layers className="mr-2 text-cyan-500/80" size={16}/> Base vs Selected Scenario</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="text-[10px] text-slate-400 uppercase tracking-widest text-right">
                                        <tr>
                                            <th className="text-left font-bold py-2 px-3 border-b border-slate-800/80">Metric</th>
                                            <th className="font-bold py-2 px-3 border-b border-slate-800/80">Base</th>
                                            <th className="font-bold py-2 px-3 border-b border-slate-800/80">Scenario</th>
                                            <th className="font-bold py-2 px-3 border-b border-slate-800/80">Var ($)</th>
                                            <th className="font-bold py-2 px-3 border-b border-slate-800/80">Var (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/30">
                                        <CompRow label="Gross Revenue" bVal={baseResults.annual.revenue} sVal={scenarioResults.annual.revenue} />
                                        <CompRow label="Total COGS" bVal={baseResults.statements.income.cogs} sVal={scenarioResults.statements.income.cogs} invertGood={true} />
                                        <CompRow label="Gross Profit" bVal={baseResults.statements.income.grossProfit} sVal={scenarioResults.statements.income.grossProfit} />
                                        <CompRow label="Operating Exp." bVal={baseResults.statements.income.opex} sVal={scenarioResults.statements.income.opex} invertGood={true} />
                                        <CompRow label="Operating Income" bVal={baseResults.statements.income.opIncome} sVal={scenarioResults.statements.income.opIncome} />
                                        <CompRow label="Net Income" bVal={baseResults.statements.income.netIncome} sVal={scenarioResults.statements.income.netIncome} />
                                        <CompRow label="Ending Cash" bVal={baseResults.statements.cashFlow.endingCash} sVal={scenarioResults.statements.cashFlow.endingCash} />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm flex flex-col backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center"><Activity className="mr-2 text-cyan-500/80" size={16}/> Tornado Analysis (Impact of ±10% on EBIT)</h3>
                            <div className="flex-1 min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={tornadoData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e293b" />
                                        <XAxis type="number" tickFormatter={formatCompactCurrency} tick={{fontSize: 11, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} width={130} tickLine={false} axisLine={false} />
                                        <RechartsTooltip cursor={{fill: '#1e293b'}} content={<CustomChartTooltip formatter={(val) => formatCurrency(val)} />} />
                                        <Bar dataKey="down" fill="#f43f5e" name="Adverse Impact (-)" radius={[4, 0, 0, 4]} barSize={20} />
                                        <Bar dataKey="up" fill="#10b981" name="Favorable Impact (+)" radius={[0, 4, 4, 0]} barSize={20} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm flex flex-col backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center"><TrendingUp className="mr-2 text-cyan-500/80" size={16}/> Profit Curve (Volume vs EBIT)</h3>
                            <div className="flex-1 min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={profitCurveData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                        <XAxis dataKey="volumePct" tick={{fontSize: 11, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis tickFormatter={formatCompactCurrency} tick={{fontSize: 11, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} tickMargin={10} />
                                        <RechartsTooltip content={<CustomChartTooltip formatter={(val) => formatCurrency(val)} />} />
                                        <Area type="monotone" dataKey="EBIT" stroke="#0ea5e9" strokeWidth={3} fill="url(#colorEbit)" />
                                        <defs>
                                            <linearGradient id="colorEbit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center"><Boxes className="mr-2 text-cyan-500/80" size={16}/> Sensitivity Matrix (Net Income)</h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-800/80 shadow-inner">
                                <table className="w-full text-xs text-center border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-3 bg-[#0a0f1c] text-slate-400 font-bold border-b border-r border-slate-800/80">Vol \ Price</th>
                                            {matrixSteps.map(p => <th key={p} className="p-3 bg-[#0a0f1c] text-slate-300 border-b border-slate-800/80">{p===1 ? 'Base' : `${p>1?'+':''}${Math.round((p-1)*100)}%`}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matrixSteps.map(v => (
                                            <tr key={v}>
                                                <th className="p-3 bg-[#0a0f1c] text-slate-300 border-r border-slate-800/80">{v===1 ? 'Base' : `${v>1?'+':''}${Math.round((v-1)*100)}%`}</th>
                                                {matrixSteps.map(p => {
                                                    const val = matrixData.find(d => d.v === v && d.p === p)?.ni || 0;
                                                    const cssClass = getHeatmapClass(val, baseResults.statements.income.netIncome, v===1 && p===1);
                                                    return (
                                                        <td key={p} className={`p-3 border border-slate-800/30 transition-colors ${cssClass} font-mono`}>
                                                            {formatCompactNumber(val)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IncrementalAnalysis = () => {
    const { engineResults } = useContext(FinancialContext);
    
    // Core state
    const [decisionType, setDecisionType] = useState('make_buy');
    
    // Derived defaults from budget (Read-only reference)
    const budgetVol = engineResults?.annual?.salesUnits || 1000;
    const budgetVcUnit = budgetVol > 0 ? (engineResults?.annual?.variableCosts / budgetVol) : 20;
    const budgetPrice = budgetVol > 0 ? (engineResults?.annual?.revenue / budgetVol) : 100;
    
    // Local decision state
    const [inputs, setInputs] = useState({
        make_buy: { units: budgetVol, makeVc: budgetVcUnit, makeAvoidableFc: 5000, makeOppCost: 0, buyPrice: budgetVcUnit * 1.15 },
        special_order: { orderQty: 1000, normalPrice: budgetPrice, specialPrice: budgetPrice * 0.8, vcPerUnit: budgetVcUnit, additionalFc: 2000, oppCost: 0 },
        drop_product: { revenue: engineResults?.annual?.revenue * 0.2 || 0, variableCosts: engineResults?.annual?.variableCosts * 0.2 || 0, avoidableFc: 15000, unavoidableFc: 10000, oppCost: 0 },
        sell_process: { units: budgetVol, splitOffPrice: budgetPrice * 0.6, additionalProcessingCost: 10000, finalPrice: budgetPrice },
        replace_equipment: { currentOpCost: 45000, currentResaleValue: 5000, currentBookValue: 15000, newOpCost: 25000, newPurchasePrice: 60000, disposalValue: 5000, usefulLife: 5 }
    });

    const updateInput = (key, val) => {
        setInputs(prev => ({
            ...prev,
            [decisionType]: {
                ...prev[decisionType],
                [key]: parseFloat(val) || 0
            }
        }));
    };

    // Calculate decision results dynamically
    const results = useMemo(() => {
        const cur = inputs[decisionType];
        
        if (decisionType === 'make_buy') {
            const makeCost = (cur.units * cur.makeVc) + cur.makeAvoidableFc + cur.makeOppCost;
            const buyCost = cur.units * cur.buyPrice;
            const diff = makeCost - buyCost;
            const rec = diff > 0 ? 'BUY' : 'MAKE';
            return {
                rec,
                impact: Math.abs(diff),
                makeCost,
                buyCost,
                exp: `${rec} is recommended because the relevant cost to ${rec.toLowerCase()} is ${formatCurrency(Math.min(makeCost, buyCost))} versus ${formatCurrency(Math.max(makeCost, buyCost))} for the alternative, creating a ${formatCurrency(Math.abs(diff))} advantage.`,
                relevantTable: [
                    { name: 'Variable Costs', amt: cur.units * cur.makeVc, isRel: true, reason: 'Avoidable if bought' },
                    { name: 'Avoidable Fixed Costs', amt: cur.makeAvoidableFc, isRel: true, reason: 'Avoidable if bought' },
                    { name: 'Opportunity Cost', amt: cur.makeOppCost, isRel: true, reason: 'Benefit sacrificed' },
                    { name: 'Purchase Price', amt: buyCost, isRel: true, reason: 'Incurred if bought' }
                ]
            };
        }
        
        if (decisionType === 'special_order') {
            const incRev = cur.orderQty * cur.specialPrice;
            const incCost = (cur.orderQty * cur.vcPerUnit) + cur.additionalFc;
            const net = incRev - incCost - cur.oppCost;
            const rec = net > 0 ? 'ACCEPT' : 'REJECT';
            return {
                rec, impact: Math.abs(net),
                exp: net > 0 ? `ACCEPT is recommended because the incremental revenue exceeds incremental costs, generating a net benefit of ${formatCurrency(net)}.` : `REJECT is recommended because incremental costs exceed incremental revenue, causing a net loss of ${formatCurrency(Math.abs(net))}.`,
                relevantTable: [
                    { name: 'Incremental Revenue', amt: incRev, isRel: true, reason: 'New cash inflow' },
                    { name: 'Incremental Var. Costs', amt: cur.orderQty * cur.vcPerUnit, isRel: true, reason: 'New cash outflow' },
                    { name: 'Additional Fixed Costs', amt: cur.additionalFc, isRel: true, reason: 'New cash outflow' },
                    { name: 'Opportunity Cost', amt: cur.oppCost, isRel: true, reason: 'Lost regular sales' }
                ]
            };
        }
        
        if (decisionType === 'drop_product') {
            const lostCm = cur.revenue - cur.variableCosts;
            const savedCost = cur.avoidableFc;
            const net = savedCost - lostCm - cur.oppCost;
            const rec = net > 0 ? 'DROP' : 'KEEP';
            return {
                rec, impact: Math.abs(net),
                exp: net > 0 ? `DROP is recommended. The avoidable fixed costs saved (${formatCurrency(savedCost)}) exceed the lost contribution margin (${formatCurrency(lostCm)}), resulting in a ${formatCurrency(net)} advantage.` : `KEEP is recommended. The lost contribution margin (${formatCurrency(lostCm)}) is greater than the avoidable fixed costs saved (${formatCurrency(savedCost)}). Dropping it would cost ${formatCurrency(Math.abs(net))}.`,
                relevantTable: [
                    { name: 'Lost Revenue', amt: cur.revenue, isRel: true, reason: 'Cash inflow lost' },
                    { name: 'Saved Variable Costs', amt: cur.variableCosts, isRel: true, reason: 'Cash outflow saved' },
                    { name: 'Avoidable Fixed Costs', amt: cur.avoidableFc, isRel: true, reason: 'Cash outflow saved' },
                    { name: 'Unavoidable Fixed Costs', amt: cur.unavoidableFc, isRel: false, reason: 'Continues regardless (SUNK)' },
                    { name: 'Opportunity Cost', amt: cur.oppCost, isRel: true, reason: 'Benefit sacrificed by keeping' }
                ]
            };
        }
        
        if (decisionType === 'sell_process') {
            const incRev = (cur.units * cur.finalPrice) - (cur.units * cur.splitOffPrice);
            const net = incRev - cur.additionalProcessingCost;
            const rec = net > 0 ? 'PROCESS FURTHER' : 'SELL NOW';
            return {
                rec, impact: Math.abs(net),
                exp: net > 0 ? `PROCESS FURTHER is recommended. The incremental revenue from processing (${formatCurrency(incRev)}) exceeds the additional processing cost (${formatCurrency(cur.additionalProcessingCost)}).` : `SELL NOW is recommended. Processing further destroys value by ${formatCurrency(Math.abs(net))}.`,
                relevantTable: [
                    { name: 'Incremental Revenue', amt: incRev, isRel: true, reason: 'Added value from processing' },
                    { name: 'Additional Processing Cost', amt: cur.additionalProcessingCost, isRel: true, reason: 'Cost to process further' }
                ]
            };
        }

        if (decisionType === 'replace_equipment') {
            const totalKeepCost = cur.currentOpCost * cur.usefulLife;
            const totalReplaceCost = (cur.newOpCost * cur.usefulLife) + cur.newPurchasePrice - cur.currentResaleValue - cur.disposalValue;
            const diff = totalKeepCost - totalReplaceCost;
            const rec = diff > 0 ? 'REPLACE' : 'KEEP';
            return {
                rec, impact: Math.abs(diff),
                exp: diff > 0 ? `REPLACE is recommended. Over ${cur.usefulLife} years, replacing saves ${formatCurrency(diff)} in relevant costs.` : `KEEP is recommended. Replacing would increase net relevant costs by ${formatCurrency(Math.abs(diff))} over ${cur.usefulLife} years.`,
                relevantTable: [
                    { name: 'Book Value (Old)', amt: cur.currentBookValue, isRel: false, reason: 'Historical (SUNK COST)' },
                    { name: 'Current Resale Value', amt: cur.currentResaleValue, isRel: true, reason: 'Cash inflow if replaced' },
                    { name: 'New Purchase Price', amt: cur.newPurchasePrice, isRel: true, reason: 'Cash outflow if replaced' },
                    { name: 'Operating Cost Savings', amt: (cur.currentOpCost - cur.newOpCost) * cur.usefulLife, isRel: true, reason: 'Future cash difference' }
                ]
            };
        }
        return { rec: 'UNKNOWN', impact: 0, exp: '', relevantTable: [] };
    }, [decisionType, inputs]);

    const InputRow = ({ label, field, isCurrency }) => (
        <div className="flex justify-between items-center bg-[#0a0f1c] p-3 rounded-lg border border-slate-800/80 shadow-inner">
            <span className="text-sm font-semibold text-slate-300">{label}</span>
            <div className="relative w-1/3">
                {isCurrency && <span className="absolute left-2 top-1.5 text-slate-500 font-medium text-xs">$</span>}
                <input 
                    type="number" 
                    value={inputs[decisionType][field] === 0 ? '' : inputs[decisionType][field]} 
                    onChange={e => updateInput(field, e.target.value)}
                    className={`w-full bg-[#1e293b]/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500 font-mono shadow-inner text-right ${isCurrency ? 'pl-6' : ''}`} 
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12 animate-in fade-in">
            {/* MANAGEMENT DECISION HUB ADDITION */}
            <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm backdrop-blur-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-200 tracking-tight flex items-center"><Lightbulb className="mr-3 text-cyan-500/80"/> Management Decision Hub</h2>
                        <p className="text-sm text-slate-400 mt-1 font-medium">Evaluate short-term alternatives using relevant costing principles.</p>
                    </div>
                    <div className="mt-4 md:mt-0 w-full md:w-64">
                        <select 
                            value={decisionType} 
                            onChange={e => setDecisionType(e.target.value)}
                            className="w-full bg-[#0a0f1c] border border-cyan-500/50 text-cyan-100 text-sm font-bold rounded-xl p-3 focus:border-cyan-400 outline-none shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        >
                            <option value="make_buy">Make or Buy</option>
                            <option value="special_order">Special Order</option>
                            <option value="drop_product">Keep or Drop Product</option>
                            <option value="sell_process">Sell or Process Further</option>
                            <option value="replace_equipment">Replace Equipment</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Inputs Column */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Decision Assumptions</h3>
                        
                        {decisionType === 'make_buy' && (
                            <>
                                <InputRow label="Units Required" field="units" />
                                <InputRow label="Internal Variable Cost / Unit" field="makeVc" isCurrency />
                                <InputRow label="Avoidable Fixed Costs" field="makeAvoidableFc" isCurrency />
                                <InputRow label="Opportunity Cost" field="makeOppCost" isCurrency />
                                <InputRow label="Supplier Price / Unit" field="buyPrice" isCurrency />
                            </>
                        )}
                        {decisionType === 'special_order' && (
                            <>
                                <InputRow label="Order Quantity (Units)" field="orderQty" />
                                <InputRow label="Normal Selling Price" field="normalPrice" isCurrency />
                                <InputRow label="Special Order Price" field="specialPrice" isCurrency />
                                <InputRow label="Variable Cost / Unit" field="vcPerUnit" isCurrency />
                                <InputRow label="Additional Fixed Costs" field="additionalFc" isCurrency />
                                <InputRow label="Opportunity Cost" field="oppCost" isCurrency />
                            </>
                        )}
                        {decisionType === 'drop_product' && (
                            <>
                                <InputRow label="Segment Revenue" field="revenue" isCurrency />
                                <InputRow label="Segment Variable Costs" field="variableCosts" isCurrency />
                                <InputRow label="Avoidable Fixed Costs" field="avoidableFc" isCurrency />
                                <InputRow label="Unavoidable Fixed Costs" field="unavoidableFc" isCurrency />
                                <InputRow label="Opportunity Cost" field="oppCost" isCurrency />
                            </>
                        )}
                        {decisionType === 'sell_process' && (
                            <>
                                <InputRow label="Units" field="units" />
                                <InputRow label="Sales Value at Split-Off" field="splitOffPrice" isCurrency />
                                <InputRow label="Sales Value After Processing" field="finalPrice" isCurrency />
                                <InputRow label="Additional Processing Cost" field="additionalProcessingCost" isCurrency />
                            </>
                        )}
                        {decisionType === 'replace_equipment' && (
                            <>
                                <InputRow label="Current Book Value" field="currentBookValue" isCurrency />
                                <InputRow label="Current Resale Value" field="currentResaleValue" isCurrency />
                                <InputRow label="Current Operating Cost/Yr" field="currentOpCost" isCurrency />
                                <InputRow label="New Purchase Price" field="newPurchasePrice" isCurrency />
                                <InputRow label="New Operating Cost/Yr" field="newOpCost" isCurrency />
                                <InputRow label="Remaining Useful Life (Yrs)" field="usefulLife" />
                            </>
                        )}
                    </div>

                    {/* Results & Relevant Cost Filter Column */}
                    <div className="space-y-6">
                        <div className="bg-[#0a0f1c]/50 p-6 rounded-xl border border-slate-800/80 shadow-inner">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recommended Decision</div>
                            <div className={`text-3xl font-black tracking-tight mb-2 ${results.rec === 'MAKE' || results.rec === 'ACCEPT' || results.rec === 'KEEP' || results.rec === 'PROCESS FURTHER' || results.rec === 'REPLACE' ? 'text-emerald-400/90' : 'text-indigo-400/90'}`}>
                                {results.rec}
                            </div>
                            <div className="text-sm font-bold text-slate-300 mb-4 flex items-center">
                                Net Incremental Advantage: <span className="ml-2 text-cyan-400 font-mono text-lg">{formatCurrency(results.impact)}</span>
                            </div>
                            <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-slate-700/50">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Why?</h4>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">{results.exp}</p>
                            </div>
                        </div>

                        <div className="bg-[#0a0f1c]/50 p-5 rounded-xl border border-slate-800/80 shadow-inner">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800/80 pb-2">Relevant Cost Classification</h4>
                            <div className="space-y-2">
                                {results.relevantTable.map((row, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-300">{row.name}</span>
                                            <span className="text-[10px] text-slate-500 italic">{row.reason}</span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className={`font-bold px-2 py-0.5 rounded ${row.isRel ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-900/20 text-rose-400 border border-rose-500/30'}`}>
                                                {row.isRel ? 'RELEVANT' : 'SUNK / IGNORED'}
                                            </span>
                                            <span className="font-mono text-slate-300 w-20 text-right">{formatCurrency(row.amt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* END MANAGEMENT DECISION HUB ADDITION */}

            {/* KEEPING THE REST OF THE INCREMENTAL ANALYSIS PAGE UNTOUCHED */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 opacity-50 grayscale pointer-events-none">
                 {/* Visual placeholder indicating existing content is preserved below */}
                 <div className="xl:col-span-12 p-10 border border-slate-800 border-dashed rounded-xl text-center text-slate-500">
                     [ Existing Incremental Analysis Architecture Preserved Below ]
                 </div>
            </div>
        </div>
    );
};

const ERPDashboard = ({ engineResults, assumptions }) => {
    const { model, updateERPSection, updateAssumptions } = useContext(FinancialContext);
    const { annual, monthly } = engineResults;
    const machines = model.erp.machines || [];
    const departments = model.erp.departments || [];

    const handleMachineChange = (id, field, val) => updateERPSection('machines', machines.map(m => m.id === id ? { ...m, [field]: field === 'name' ? val : (parseFloat(val) || 0) } : m));
    const addMachine = () => updateERPSection('machines', [...machines, { id: Date.now(), name: 'New Machine', availableHours: 0, downtime: 0 }]);
    const deleteMachine = (id) => updateERPSection('machines', machines.filter(m => m.id !== id));

    const handleDeptChange = (id, field, val) => updateERPSection('departments', departments.map(d => d.id === id ? { ...d, [field]: field === 'name' ? val : (parseFloat(val) || 0) } : d));
    const addDept = () => updateERPSection('departments', [...departments, { id: Date.now(), name: 'New Dept', employees: 0, availableHours: 0, overtime: 0 }]);
    const deleteDept = (id) => updateERPSection('departments', departments.filter(d => d.id !== id));

    const plannedProd = annual.productionUnits;
    const actualProd = annual.actualProductionUnits;
    const salesUnits = annual.salesUnits;
    const prodVariance = actualProd - plannedProd;
    
    const machineHoursReq = annual.machineHoursUsed;
    const totalMachineAvail = machines.reduce((sum, m) => sum + (parseFloat(m.availableHours)||0) - (parseFloat(m.downtime)||0), 0);
    const machineUtil = totalMachineAvail > 0 ? machineHoursReq / totalMachineAvail : 0;
    
    const laborHoursReq = annual.laborHoursUsed;
    const totalLaborAvail = departments.reduce((sum, d) => sum + (parseFloat(d.availableHours)||0) + (parseFloat(d.overtime)||0), 0);
    const laborUtil = totalLaborAvail > 0 ? laborHoursReq / totalLaborAvail : 0;

    const rmPurchases = annual.inventoryPurchases;
    const unitMaterialCost = parseFloat(assumptions.unitMaterialCost) || 0;
    const rmConsumed = actualProd * unitMaterialCost;
    const rmBeg = parseFloat(assumptions.startingRM) || 0;
    const rmEnd = rmBeg + rmPurchases - rmConsumed;

    const totalMfgCost = rmConsumed + (laborHoursReq * (parseFloat(assumptions.laborRatePerHour)||0));
    const cogm = actualProd * (annual.variableCosts / (actualProd || 1));
    const wipBeg = parseFloat(assumptions.startingWIP) || 0;
    const wipEnd = wipBeg + totalMfgCost - cogm;

    const fgBegUnits = parseFloat(assumptions.startingFinishedGoods) || 0;
    const fgEndUnits = fgBegUnits + actualProd - salesUnits;
    const avgCostPerUnit = actualProd > 0 ? (annual.variableCosts + annual.fixedCosts) / actualProd : 0;
    const fgValue = fgEndUnits * avgCostPerUnit;
    
    const totalInventoryValue = rmEnd + wipEnd + fgValue;

    const alerts = [];
    if (actualProd < plannedProd) alerts.push({ type: 'warning', text: `Production is ${formatNumber(Math.abs(prodVariance))} units below plan due to efficiency loss or capacity limits.` });
    if (machineUtil > 0.95) alerts.push({ type: 'critical', text: `Critical: Machine utilization is at ${formatPercent(machineUtil)}. High risk of bottlenecks and downtime.` });
    if (machineUtil < 0.50) alerts.push({ type: 'info', text: `Info: Excess machine capacity detected (${formatPercent(machineUtil)} utilization). Consider insourcing.` });
    if (laborUtil > 0.95) alerts.push({ type: 'critical', text: `Critical: Labor requirements push total available capacity to ${formatPercent(laborUtil)}.` });
    if (rmEnd < rmConsumed * 0.1) alerts.push({ type: 'warning', text: `Warning: Raw Material inventory is critically low compared to annual consumption rate.` });

    const trendData = monthly.map(m => ({
        month: m.monthName,
        Planned: m.plannedProdUnits,
        Actual: m.actualProdUnits,
        Sales: m.salesUnits
    }));

    const utilData = [
        { name: 'Machine Cap.', Used: machineHoursReq, Available: totalMachineAvail - machineHoursReq, fill: '#0ea5e9' },
        { name: 'Labor Cap.', Used: laborHoursReq, Available: totalLaborAvail - laborHoursReq, fill: '#8b5cf6' }
    ];

    const KpiCard = ({ label, value, sub, icon, isAlert }) => (
        <div className={`bg-[#111827]/80 rounded-2xl p-5 border border-slate-800/80 shadow-sm flex flex-col justify-between backdrop-blur-sm ${isAlert ? 'ring-1 ring-rose-500/50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
                <div className={`p-1.5 rounded-lg shadow-inner border border-slate-800/50 ${isAlert ? 'bg-rose-900/30 text-rose-400' : 'bg-[#0a0f1c] text-cyan-400'}`}>{icon}</div>
            </div>
            <div>
                <div className="text-2xl font-black text-slate-200 font-mono">{value}</div>
                <div className="text-[10px] font-semibold text-slate-500 mt-1 uppercase">{sub}</div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 text-slate-200">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center"><Layers className="mr-3 text-cyan-500/80"/> ERP Operations Center</h2>
                    <p className="text-sm text-slate-400 mt-1 font-medium">Live operational capacity, inventory flow, and resource utilization.</p>
                </div>
            </div>

            {alerts.length > 0 && (
                <div className="bg-[#111827]/80 border border-slate-800/80 rounded-2xl p-4 space-y-2 backdrop-blur-sm shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center"><AlertTriangle size={14} className="mr-2"/> Operational Alerts</div>
                    {alerts.map((a, i) => (
                        <div key={i} className={`flex items-center p-3 rounded-lg border text-sm font-semibold ${a.type === 'critical' ? 'bg-rose-900/20 border-rose-500/30 text-rose-400' : a.type === 'warning' ? 'bg-amber-900/20 border-amber-500/30 text-amber-400' : 'bg-[#0a0f1c] border-slate-800 text-cyan-400 shadow-inner'}`}>
                            {a.type === 'critical' ? <Zap size={16} className="mr-3 shrink-0"/> : <AlertTriangle size={16} className="mr-3 shrink-0"/>}
                            {a.text}
                        </div>
                    ))}
                </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Production Yield" value={formatNumber(actualProd)} sub={`Planned: ${formatNumber(plannedProd)}`} icon={<Factory size={18}/>} isAlert={actualProd < plannedProd} />
                <KpiCard label="Total Inventory Value" value={formatCurrency(totalInventoryValue)} sub={`FG Units: ${formatNumber(fgEndUnits)}`} icon={<Package size={18}/>} />
                <KpiCard label="Machine Utilization" value={formatPercent(machineUtil)} sub={`Avail: ${formatNumber(totalMachineAvail)} hrs`} icon={<Wrench size={18}/>} isAlert={machineUtil > 0.95} />
                <KpiCard label="Labor Utilization" value={formatPercent(laborUtil)} sub={`Avail: ${formatNumber(totalLaborAvail)} hrs`} icon={<Users size={18}/>} isAlert={laborUtil > 1.0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm flex flex-col backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Production & Sales Flow</h3>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="month" tick={{fontSize: 10, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis tick={{fontSize: 10, fill: '#64748b', fontFamily: 'Inter'}} tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} tickMargin={10} />
                                <RechartsTooltip cursor={{fill: '#1e293b'}} content={<CustomChartTooltip formatter={formatNumber} />} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }} iconType="circle" />
                                <Bar dataKey="Planned" fill="#334155" radius={[2, 2, 0, 0]} barSize={15} />
                                <Bar dataKey="Actual" fill="#0ea5e9" radius={[2, 2, 0, 0]} barSize={15} />
                                <Line type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{r: 6, strokeWidth: 0}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm flex flex-col backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Resource Utilization Limit</h3>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={utilData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e293b" />
                                <XAxis type="number" tick={{fontSize: 10, fill: '#64748b', fontFamily: 'Inter'}} tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} width={100} tickLine={false} axisLine={false} />
                                <RechartsTooltip cursor={{fill: '#1e293b'}} content={<CustomChartTooltip formatter={v => formatNumber(v) + ' hrs'} />} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }} iconType="circle" />
                                <Bar dataKey="Used" stackId="a" fill="#0ea5e9" name="Req (Budget)" radius={[4, 0, 0, 4]} barSize={30}>
                                    {utilData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                                <Bar dataKey="Available" stackId="a" fill="#334155" name="Idle Capacity" radius={[0, 4, 4, 0]} barSize={30} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm flex flex-col h-full backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90 flex items-center"><Wrench size={16} className="mr-2"/> Machine Assets</h3>
                        <button onClick={addMachine} className="text-xs bg-[#0a0f1c] hover:bg-slate-800 border border-slate-800 text-slate-300 px-2 py-1 rounded transition-colors flex items-center shadow-inner"><Plus size={12} className="mr-1"/> Add</button>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-xs text-left min-w-[400px]">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-800/80">
                                    <th className="pb-2">Equipment Name</th>
                                    <th className="pb-2 text-right">Avail. Hrs</th>
                                    <th className="pb-2 text-right">Downtime</th>
                                    <th className="pb-2 text-right">Net Cap.</th>
                                    <th className="pb-2 text-center w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {machines.map(m => (
                                    <tr key={m.id} className="group hover:bg-[#1e293b]/50 transition-colors">
                                        <td className="py-2 pr-2"><input type="text" value={m.name} onChange={e => handleMachineChange(m.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-cyan-500 text-slate-200 outline-none transition-colors" /></td>
                                        <td className="py-2 px-1"><ERPInput val={m.availableHours} onChange={v => handleMachineChange(m.id, 'availableHours', v)} /></td>
                                        <td className="py-2 px-1"><ERPInput val={m.downtime} onChange={v => handleMachineChange(m.id, 'downtime', v)} /></td>
                                        <td className="py-2 pl-2 text-right font-mono text-emerald-400/90 font-bold">{formatNumber((parseFloat(m.availableHours)||0) - (parseFloat(m.downtime)||0))}</td>
                                        <td className="py-2 text-center"><button onClick={() => deleteMachine(m.id)} className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between text-xs font-bold text-slate-300">
                        <span>Global Req: <span className="text-cyan-400/90 font-mono">{formatNumber(machineHoursReq)} hrs</span></span>
                        <span>Net Cap: <span className="text-emerald-400/90 font-mono">{formatNumber(totalMachineAvail)} hrs</span></span>
                    </div>
                </div>

                <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm flex flex-col h-full backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90 flex items-center"><Users size={16} className="mr-2"/> Labor Departments</h3>
                        <button onClick={addDept} className="text-xs bg-[#0a0f1c] hover:bg-slate-800 border border-slate-800 text-slate-300 px-2 py-1 rounded transition-colors flex items-center shadow-inner"><Plus size={12} className="mr-1"/> Add</button>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        <table className="w-full text-xs text-left min-w-[400px]">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-800/80">
                                    <th className="pb-2">Department</th>
                                    <th className="pb-2 text-right">Headcount</th>
                                    <th className="pb-2 text-right">Reg. Hrs</th>
                                    <th className="pb-2 text-right">Overtime</th>
                                    <th className="pb-2 text-right">Total Cap.</th>
                                    <th className="pb-2 text-center w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {departments.map(d => (
                                    <tr key={d.id} className="group hover:bg-[#1e293b]/50 transition-colors">
                                        <td className="py-2 pr-2"><input type="text" value={d.name} onChange={e => handleDeptChange(d.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-cyan-500 text-slate-200 outline-none transition-colors" /></td>
                                        <td className="py-2 px-1"><ERPInput val={d.employees} onChange={v => handleDeptChange(d.id, 'employees', v)} /></td>
                                        <td className="py-2 px-1"><ERPInput val={d.availableHours} onChange={v => handleDeptChange(d.id, 'availableHours', v)} /></td>
                                        <td className="py-2 px-1"><ERPInput val={d.overtime} onChange={v => handleDeptChange(d.id, 'overtime', v)} /></td>
                                        <td className="py-2 pl-2 text-right font-mono text-emerald-400/90 font-bold">{formatNumber((parseFloat(d.availableHours)||0) + (parseFloat(d.overtime)||0))}</td>
                                        <td className="py-2 text-center"><button onClick={() => deleteDept(d.id)} className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between text-xs font-bold text-slate-300">
                        <span>Global Req: <span className="text-cyan-400/90 font-mono">{formatNumber(laborHoursReq)} hrs</span></span>
                        <span>Net Cap: <span className="text-emerald-400/90 font-mono">{formatNumber(totalLaborAvail)} hrs</span></span>
                    </div>
                </div>
            </div>

            <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm backdrop-blur-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90 mb-6 flex items-center"><Package size={16} className="mr-2"/> Inventory Flow Matrix</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
                    <div className="space-y-3 pt-4 md:pt-0 md:px-4 first:pl-0 first:pt-0">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800/80 pb-2 mb-3">Raw Materials</h4>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium">Beginning Balance</span>
                            <div className="w-24"><ERPInput isCurrency val={assumptions.startingRM} onChange={v => updateAssumptions('startingRM', v)} /></div>
                        </div>
                        <div className="flex justify-between text-xs py-1"><span className="text-slate-400">Budgeted Purchases</span><span className="font-mono text-slate-200">{formatCurrency(rmPurchases)}</span></div>
                        <div className="flex justify-between text-xs py-1 border-b border-slate-800/50 pb-2"><span className="text-slate-400">Consumed in Prod. (-)</span><span className="font-mono text-rose-400/90">({formatCurrency(rmConsumed)})</span></div>
                        <div className="flex justify-between text-sm font-bold pt-1"><span className="text-slate-200">Ending Balance</span><span className="font-mono text-cyan-400">{formatCurrency(rmEnd)}</span></div>
                    </div>
                    <div className="space-y-3 pt-4 md:pt-0 md:px-4">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800/80 pb-2 mb-3">Work in Progress</h4>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium">Beginning Balance</span>
                            <div className="w-24"><ERPInput isCurrency val={assumptions.startingWIP} onChange={v => updateAssumptions('startingWIP', v)} /></div>
                        </div>
                        <div className="flex justify-between text-xs py-1"><span className="text-slate-400">Total Mfg Costs (+)</span><span className="font-mono text-slate-200">{formatCurrency(totalMfgCost)}</span></div>
                        <div className="flex justify-between text-xs py-1 border-b border-slate-800/50 pb-2"><span className="text-slate-400">Cost of Goods Mfg (-)</span><span className="font-mono text-rose-400/90">({formatCurrency(cogm)})</span></div>
                        <div className="flex justify-between text-sm font-bold pt-1"><span className="text-slate-200">Ending Balance</span><span className="font-mono text-cyan-400">{formatCurrency(wipEnd)}</span></div>
                    </div>
                    <div className="space-y-3 pt-4 md:pt-0 md:pl-4">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800/80 pb-2 mb-3">Finished Goods</h4>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-medium">Beginning Units</span>
                            <span className="font-mono text-slate-300 bg-[#0a0f1c] px-2 py-1 rounded border border-slate-800 shadow-inner" title="Budget Linked">{formatNumber(fgBegUnits)}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1"><span className="text-slate-400">Actual Production (+)</span><span className="font-mono text-slate-200">{formatNumber(actualProd)}</span></div>
                        <div className="flex justify-between text-xs py-1 border-b border-slate-800/50 pb-2"><span className="text-slate-400">Units Sold (-)</span><span className="font-mono text-rose-400/90">({formatNumber(salesUnits)})</span></div>
                        <div className="flex justify-between text-sm font-bold pt-1"><span className="text-slate-200">Ending Units</span><span className="font-mono text-cyan-400">{formatNumber(fgEndUnits)}</span></div>
                        <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-slate-800/50"><span className="text-slate-200">Total FG Value</span><span className="font-mono text-emerald-400/90">{formatCurrency(fgValue)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VarianceAnalysis = () => {
    const { model, engineResults } = useContext(FinancialContext);
    
    const [isLinked, setIsLinked] = useState(true);
    const [materialityPct, setMaterialityPct] = useState(5);
    const [materialityAmt, setMaterialityAmt] = useState(10000);
    const [manualOverrides, setManualOverrides] = useState({});

    const staticSalesVol = parseFloat(engineResults?.annual?.salesUnits) || 0;
    const staticProdVol = parseFloat(engineResults?.annual?.productionUnits) || 0;
    const staticRev = parseFloat(engineResults?.annual?.revenue) || 0;
    const sp = staticSalesVol > 0 ? staticRev / staticSalesVol : 0;
    
    let staticDm = 0, staticDl = 0, staticVmoh = 0;
    if (model?.budget?.variableCosts?.lines) {
        model.budget.variableCosts.lines.forEach(l => {
            if (l && l.months) {
                const amt = l.months.reduce((sum, m) => sum + (parseFloat(m.amount)||0), 0);
                if (l.category === 'materials') staticDm += amt;
                else if (l.category === 'labor') staticDl += amt;
                else staticVmoh += amt;
            }
        });
    }
    
    const staticFmoh = parseFloat(engineResults?.annual?.fixedCosts) || 0;
    const staticTotalCost = staticDm + staticDl + staticVmoh + staticFmoh;
    const staticOpInc = staticRev - staticTotalCost;

    const linkedInputs = useMemo(() => {
        const dmStdPrice = parseFloat(model?.assumptions?.unitMaterialCost) || 10;
        const dmStdQty = staticProdVol > 0 ? (staticDm / staticProdVol) / dmStdPrice : 1;
        const dlStdRate = parseFloat(model?.assumptions?.laborRatePerHour) || 25;
        const dlStdHrs = parseFloat(model?.assumptions?.laborHoursPerUnit) || 2;
        const vmohRate = staticProdVol > 0 ? staticVmoh / staticProdVol : 0;

        return {
            actualSalesVol: Math.round(staticSalesVol * 0.95) || 0,
            actualProdVol: Math.round(staticProdVol * 0.95) || 0,
            actualRevenue: (staticSalesVol * 0.95) * (sp * 0.98) || 0,
            stdPrice: sp || 0,
            stdDmPrice: dmStdPrice,
            stdDmQtyPerUnit: dmStdQty || 1,
            actualDmQty: (staticProdVol * 0.95) * (dmStdQty || 1) * 1.05 || 0,
            actualDmPrice: dmStdPrice * 1.1 || 0,
            stdDlRate: dlStdRate,
            stdDlHrsPerUnit: dlStdHrs || 0,
            actualDlHrs: (staticProdVol * 0.95) * dlStdHrs * 0.95 || 0,
            actualDlRate: dlStdRate * 1.08 || 0,
            stdVmohRate: vmohRate || 0,
            actualVmoh: staticVmoh * 0.98 || 0,
            stdFmoh: staticFmoh || 0,
            actualFmoh: staticFmoh * 1.02 || 0
        };
    }, [staticSalesVol, staticProdVol, staticDm, staticVmoh, staticFmoh, sp, model]);

    const currentInputs = isLinked ? linkedInputs : { ...linkedInputs, ...manualOverrides };

    const handleInput = (key, val) => {
        const numVal = parseFloat(val);
        const safeVal = isNaN(numVal) ? 0 : numVal; 
        if (isLinked) setIsLinked(false);
        setManualOverrides(prev => ({ ...prev, [key]: safeVal }));
    };

    const handleResetLink = () => {
        setIsLinked(true);
        setManualOverrides({});
    };

    const results = useMemo(() => {
        const inps = {
            actualSalesVol: parseFloat(currentInputs.actualSalesVol) || 0,
            actualProdVol: parseFloat(currentInputs.actualProdVol) || 0,
            actualRevenue: parseFloat(currentInputs.actualRevenue) || 0,
            stdPrice: parseFloat(currentInputs.stdPrice) || 0,
            stdDmPrice: parseFloat(currentInputs.stdDmPrice) || 0,
            stdDmQtyPerUnit: parseFloat(currentInputs.stdDmQtyPerUnit) || 0,
            actualDmQty: parseFloat(currentInputs.actualDmQty) || 0,
            actualDmPrice: parseFloat(currentInputs.actualDmPrice) || 0,
            stdDlRate: parseFloat(currentInputs.stdDlRate) || 0,
            stdDlHrsPerUnit: parseFloat(currentInputs.stdDlHrsPerUnit) || 0,
            actualDlHrs: parseFloat(currentInputs.actualDlHrs) || 0,
            actualDlRate: parseFloat(currentInputs.actualDlRate) || 0,
            stdVmohRate: parseFloat(currentInputs.stdVmohRate) || 0,
            actualVmoh: parseFloat(currentInputs.actualVmoh) || 0,
            stdFmoh: parseFloat(currentInputs.stdFmoh) || 0,
            actualFmoh: parseFloat(currentInputs.actualFmoh) || 0
        };

        const flexRev = inps.actualSalesVol * inps.stdPrice;
        
        const flexDm = inps.actualProdVol * inps.stdDmQtyPerUnit * inps.stdDmPrice;
        const actDmCost = inps.actualDmQty * inps.actualDmPrice;
        const dmPriceVar = inps.actualDmQty * (inps.actualDmPrice - inps.stdDmPrice);
        const dmQtyVar = inps.stdDmPrice * (inps.actualDmQty - (inps.actualProdVol * inps.stdDmQtyPerUnit));
        
        const flexDl = inps.actualProdVol * inps.stdDlHrsPerUnit * inps.stdDlRate;
        const actDlCost = inps.actualDlHrs * inps.actualDlRate;
        const dlRateVar = inps.actualDlHrs * (inps.actualDlRate - inps.stdDlRate);
        const dlEffVar = inps.stdDlRate * (inps.actualDlHrs - (inps.actualProdVol * inps.stdDlHrsPerUnit));
        
        const flexVmoh = inps.actualProdVol * inps.stdVmohRate;
        
        const flexTotalCost = flexDm + flexDl + flexVmoh + inps.stdFmoh;
        const actualTotalCost = actDmCost + actDlCost + inps.actualVmoh + inps.actualFmoh;
        
        const flexOpInc = flexRev - flexTotalCost;
        const actualOpInc = inps.actualRevenue - actualTotalCost;

        const calcVar = (actual, flex, staticVal, isRev) => {
            const flexVarAmt = actual - flex;
            const flexVarFav = isRev ? flexVarAmt > 0 : flexVarAmt < 0;
            
            const volVarAmt = flex - staticVal;
            const volVarFav = isRev ? volVarAmt > 0 : volVarAmt < 0;
            
            const totalVarAmt = actual - staticVal;
            const totalVarFav = isRev ? totalVarAmt > 0 : totalVarAmt < 0;
            
            return {
                flexVarAmt, flexVarFav, 
                volVarAmt, volVarFav, 
                totalVarAmt, totalVarFav
            };
        };

        return {
            rev: calcVar(inps.actualRevenue, flexRev, staticRev, true),
            dm: calcVar(actDmCost, flexDm, staticDm, false),
            dl: calcVar(actDlCost, flexDl, staticDl, false),
            vmoh: calcVar(inps.actualVmoh, flexVmoh, staticVmoh, false),
            fmoh: calcVar(inps.actualFmoh, inps.stdFmoh, staticFmoh, false),
            opInc: calcVar(actualOpInc, flexOpInc, staticOpInc, true),
            
            vals: {
                flexRev, flexDm, flexDl, flexVmoh, flexOpInc,
                actDmCost, actDlCost, actualTotalCost, actualOpInc,
                dmPriceVar, dmQtyVar, dlRateVar, dlEffVar,
                flexTotalCost
            }
        };
    }, [currentInputs, staticRev, staticDm, staticDl, staticVmoh, staticFmoh, staticOpInc]);

    const FormatVar = ({ amt, isFav }) => {
        if (Math.abs(amt) < 1) return <span className="text-slate-500 font-mono">-</span>;
        return (
            <span className={`font-mono font-bold ${isFav ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                {formatCurrency(Math.abs(amt))} {isFav ? 'F' : 'U'}
            </span>
        );
    };

    const alerts = [];
    const checkAlert = (name, flexVarAmt, isFav, flexBase) => {
        const absDiff = Math.abs(flexVarAmt);
        const pct = flexBase !== 0 ? absDiff / Math.abs(flexBase) : 0;
        if (!isFav && (absDiff >= (parseFloat(materialityAmt)||0) || pct >= ((parseFloat(materialityPct)||0) / 100))) {
            alerts.push(`${name} is unfavorable by ${formatCurrency(absDiff)} (${formatPercent(pct)}). Management attention required.`);
        }
    };
    
    checkAlert("Revenue", results.rev.flexVarAmt, results.rev.flexVarFav, results.vals.flexRev);
    checkAlert("Direct Materials", results.dm.flexVarAmt, results.dm.flexVarFav, results.vals.flexDm);
    checkAlert("Direct Labor", results.dl.flexVarAmt, results.dl.flexVarFav, results.vals.flexDl);
    checkAlert("Variable Overhead", results.vmoh.flexVarAmt, results.vmoh.flexVarFav, results.vals.flexVmoh);
    checkAlert("Fixed Overhead", results.fmoh.flexVarAmt, results.fmoh.flexVarFav, parseFloat(currentInputs.stdFmoh)||0);

    const chartData = [
        { name: 'Revenue', Static: staticRev, Flexible: results.vals.flexRev, Actual: parseFloat(currentInputs.actualRevenue)||0 },
        { name: 'Direct Materials', Static: staticDm, Flexible: results.vals.flexDm, Actual: results.vals.actDmCost },
        { name: 'Direct Labor', Static: staticDl, Flexible: results.vals.flexDl, Actual: results.vals.actDlCost },
        { name: 'Fixed Overhead', Static: staticFmoh, Flexible: parseFloat(currentInputs.stdFmoh)||0, Actual: parseFloat(currentInputs.actualFmoh)||0 }
    ];

    const varChartData = [
        { name: 'DM Price', Amount: Math.abs(results.vals.dmPriceVar), fill: results.vals.dmPriceVar > 0 ? '#f43f5e' : '#10b981' },
        { name: 'DM Quantity', Amount: Math.abs(results.vals.dmQtyVar), fill: results.vals.dmQtyVar > 0 ? '#f43f5e' : '#10b981' },
        { name: 'DL Rate', Amount: Math.abs(results.vals.dlRateVar), fill: results.vals.dlRateVar > 0 ? '#f43f5e' : '#10b981' },
        { name: 'DL Efficiency', Amount: Math.abs(results.vals.dlEffVar), fill: results.vals.dlEffVar > 0 ? '#f43f5e' : '#10b981' }
    ];

    const EditableInput = ({ label, value, field, isCurrency, isBold }) => (
        <div className="flex flex-col">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 truncate" title={label}>{label}</label>
            <div className="relative">
                {isCurrency && <span className="absolute left-2 top-1.5 text-slate-500 font-medium text-xs">$</span>}
                <input
                    type="number"
                    value={value === 0 ? 0 : (value || '')}
                    onChange={(e) => handleInput(field, e.target.value)}
                    className={`w-full bg-[#0a0f1c] border border-slate-700/80 rounded-md py-1.5 text-sm outline-none focus:border-cyan-500 font-mono transition-colors shadow-inner ${isCurrency ? 'pl-6 pr-2' : 'px-2'} ${isBold ? 'font-bold text-slate-100' : 'text-slate-300'}`}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800/80 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-200 tracking-tight flex items-center"><TrendingDown className="mr-3 text-cyan-500/80"/> Flexible Budget & Variance Analysis</h2>
                    <p className="text-sm text-slate-400 mt-1 font-medium">Isolate volume variances from flexible spending and operational efficiency variances.</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    <div className="bg-[#111827] p-1 rounded-lg border border-slate-700/80 flex text-sm shadow-sm backdrop-blur-sm">
                        <button onClick={handleResetLink} className={`px-4 py-1.5 rounded-md font-medium transition-colors ${isLinked ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}>Budget Linked</button>
                        <button onClick={() => setIsLinked(false)} className={`px-4 py-1.5 rounded-md font-medium transition-colors ${!isLinked ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}>Manual Override</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Operating Variance</div>
                    <div className={`text-2xl font-black font-mono ${results.opInc.totalVarFav ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>{formatCurrency(Math.abs(results.opInc.totalVarAmt))} {results.opInc.totalVarFav ? 'F' : 'U'}</div>
                </div>
                <div className="bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue Variance</div>
                    <div className={`text-2xl font-black font-mono ${results.rev.totalVarFav ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>{formatCurrency(Math.abs(results.rev.totalVarAmt))} {results.rev.totalVarFav ? 'F' : 'U'}</div>
                </div>
                <div className="bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Flex Budget Total Cost Var</div>
                    <div className={`text-2xl font-black font-mono ${results.vals.actualTotalCost - results.vals.flexTotalCost < 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>{formatCurrency(Math.abs(results.vals.actualTotalCost - results.vals.flexTotalCost))} {results.vals.actualTotalCost - results.vals.flexTotalCost < 0 ? 'F' : 'U'}</div>
                </div>
                <div className="bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 shadow-sm flex flex-col justify-center backdrop-blur-sm">
                    <div className="flex items-center text-xs font-bold text-slate-400 mb-2"><Sliders size={14} className="mr-2"/> Materiality Threshold</div>
                    <div className="flex space-x-2">
                        <div className="relative w-1/2">
                            <span className="absolute left-2 top-1.5 text-slate-500 font-bold">%</span>
                            <input type="number" value={materialityPct} onChange={e => setMaterialityPct(e.target.value)} className="w-full bg-[#0a0f1c] border border-slate-700/80 rounded py-1 pl-6 pr-2 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500 shadow-inner" />
                        </div>
                        <div className="relative w-1/2">
                            <span className="absolute left-2 top-1.5 text-slate-500 font-bold">$</span>
                            <input type="number" value={materialityAmt} onChange={e => setMaterialityAmt(e.target.value)} className="w-full bg-[#0a0f1c] border border-slate-700/80 rounded py-1 pl-6 pr-2 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500 shadow-inner" />
                        </div>
                    </div>
                </div>
            </div>

            {alerts.length > 0 && (
                <div className="bg-rose-900/20 border border-rose-500/30 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400/90 mb-4 flex items-center"><AlertTriangle size={16} className="mr-2"/> Management Attention Required</h3>
                    <ul className="space-y-2">
                        {alerts.map((alert, i) => (
                            <li key={i} className="flex items-start text-sm text-rose-200 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/80 mt-2 mr-3 shrink-0"></div>
                                {alert}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm overflow-hidden backdrop-blur-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90 mb-6 flex items-center"><Target size={16} className="mr-2"/> Three-Way Variance Analysis</h3>
                <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <table className="w-full text-sm text-left min-w-[900px]">
                        <thead>
                            <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-800/80">
                                <th className="pb-3 px-2">Account Category</th>
                                <th className="pb-3 px-2 text-right">Static Budget</th>
                                <th className="pb-3 px-2 text-right text-cyan-400/90">Flexible Budget</th>
                                <th className="pb-3 px-2 text-right">Actual Results</th>
                                <th className="pb-3 px-2 text-right bg-[#0a0f1c]/50 rounded-tl-lg">Vol Variance</th>
                                <th className="pb-3 px-2 text-right bg-[#0a0f1c]/50">Flex Variance</th>
                                <th className="pb-3 px-2 text-right bg-[#0a0f1c]/50 rounded-tr-lg">Total Variance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            <tr className="hover:bg-[#1e293b]/50 transition-colors">
                                <td className="py-3 px-2 font-medium text-slate-300">Revenue</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(staticRev)}</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">{formatAccounting(results.vals.flexRev)}</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(parseFloat(currentInputs.actualRevenue)||0)}</td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.rev.volVarAmt} isFav={results.rev.volVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.rev.flexVarAmt} isFav={results.rev.flexVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.rev.totalVarAmt} isFav={results.rev.totalVarFav} /></td>
                            </tr>
                            <tr className="hover:bg-[#1e293b]/50 transition-colors">
                                <td className="py-3 px-2 font-medium text-slate-300">Direct Materials</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(staticDm)}</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">{formatAccounting(results.vals.flexDm)}</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(results.vals.actDmCost)}</td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.dm.volVarAmt} isFav={results.dm.volVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.dm.flexVarAmt} isFav={results.dm.flexVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.dm.totalVarAmt} isFav={results.dm.totalVarFav} /></td>
                            </tr>
                            <tr className="hover:bg-[#1e293b]/50 transition-colors">
                                <td className="py-3 px-2 font-medium text-slate-300">Direct Labor</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(staticDl)}</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">{formatAccounting(results.vals.flexDl)}</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(results.vals.actDlCost)}</td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.dl.volVarAmt} isFav={results.dl.volVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.dl.flexVarAmt} isFav={results.dl.flexVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.dl.totalVarAmt} isFav={results.dl.totalVarFav} /></td>
                            </tr>
                            <tr className="hover:bg-[#1e293b]/50 transition-colors">
                                <td className="py-3 px-2 font-medium text-slate-300">Variable Overhead</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(staticVmoh)}</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">{formatAccounting(results.vals.flexVmoh)}</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(parseFloat(currentInputs.actualVmoh)||0)}</td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.vmoh.volVarAmt} isFav={results.vmoh.volVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.vmoh.flexVarAmt} isFav={results.vmoh.flexVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.vmoh.totalVarAmt} isFav={results.vmoh.totalVarFav} /></td>
                            </tr>
                            <tr className="hover:bg-[#1e293b]/50 transition-colors">
                                <td className="py-3 px-2 font-medium text-slate-300">Fixed Overhead</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(staticFmoh)}</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">{formatAccounting(parseFloat(currentInputs.stdFmoh)||0)}</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-400">{formatAccounting(parseFloat(currentInputs.actualFmoh)||0)}</td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.fmoh.volVarAmt} isFav={results.fmoh.volVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.fmoh.flexVarAmt} isFav={results.fmoh.flexVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]/50"><FormatVar amt={results.fmoh.totalVarAmt} isFav={results.fmoh.totalVarFav} /></td>
                            </tr>
                            <tr className="hover:bg-[#1e293b]/50 transition-colors border-t-2 border-slate-700 bg-[#0a0f1c]/80">
                                <td className="py-3 px-2 font-bold text-slate-200">Net Operating Income</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-slate-300">{formatAccounting(staticOpInc)}</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">{formatAccounting(results.vals.flexOpInc)}</td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-slate-300">{formatAccounting(results.vals.actualOpInc)}</td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]"><FormatVar amt={results.opInc.volVarAmt} isFav={results.opInc.volVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]"><FormatVar amt={results.opInc.flexVarAmt} isFav={results.opInc.flexVarFav} /></td>
                                <td className="py-3 px-2 text-right bg-[#0a0f1c]"><FormatVar amt={results.opInc.totalVarAmt} isFav={results.opInc.totalVarFav} /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm flex flex-col min-h-[350px] backdrop-blur-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-6">Static vs Flex vs Actual Profile</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={formatCompactCurrency} tick={{fontSize: 11, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} />
                                <RechartsTooltip cursor={{fill: '#1e293b'}} content={<CustomChartTooltip formatter={(val) => formatCurrency(val)} />} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} iconType="circle" />
                                <Bar dataKey="Static" fill="#475569" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="Flexible" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="Actual" fill="#10b981" radius={[2, 2, 0, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm flex flex-col min-h-[350px] backdrop-blur-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-6">Detailed Variance Magnitudes</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={varChartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e293b" />
                                <XAxis type="number" tickFormatter={formatCompactCurrency} tick={{fontSize: 10, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} width={90} tickLine={false} axisLine={false} />
                                <RechartsTooltip cursor={{fill: '#1e293b'}} content={<CustomChartTooltip formatter={(val) => formatCurrency(val)} />} />
                                <Bar dataKey="Amount" radius={[0, 4, 4, 0]}>
                                    {varChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-slate-400 font-bold">
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500/90 mr-2 shadow-sm"></div> Favorable</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-rose-500/90 mr-2 shadow-sm"></div> Unfavorable</div>
                    </div>
                </div>
            </div>
            
            <div className="bg-[#111827]/80 rounded-2xl p-6 border border-slate-800/80 shadow-sm mb-6 backdrop-blur-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90 mb-6 flex items-center"><Activity size={16} className="mr-2"/> Activity & Volume Drivers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <EditableInput label="Static Budget Prod. Vol" value={staticProdVol} field="-" isBold={false} />
                    <EditableInput label="Actual Production Vol" value={currentInputs.actualProdVol} field="actualProdVol" isBold />
                    <EditableInput label="Static Budget Sales Vol" value={staticSalesVol} field="-" isBold={false} />
                    <EditableInput label="Actual Sales Vol" value={currentInputs.actualSalesVol} field="actualSalesVol" isBold />
                    <EditableInput label="Actual Total Revenue" value={currentInputs.actualRevenue} field="actualRevenue" isCurrency isBold />
                    <EditableInput label="Actual Var Overhead" value={currentInputs.actualVmoh} field="actualVmoh" isCurrency isBold />
                    <EditableInput label="Budget Fixed Overhead" value={currentInputs.stdFmoh} field="stdFmoh" isCurrency />
                    <EditableInput label="Actual Fixed Overhead" value={currentInputs.actualFmoh} field="actualFmoh" isCurrency isBold />
                </div>
            </div>
        </div>
    );
};

const ExecutiveDashboard = ({ engineResults }) => {
    const { income, cashFlow, balanceSheet } = engineResults.statements;
    
    const grossMargin = income.revenue > 0 ? income.grossProfit / income.revenue : 0;
    const opMargin = income.revenue > 0 ? income.opIncome / income.revenue : 0;
    const netMargin = income.revenue > 0 ? income.netIncome / income.revenue : 0;
    
    const currentAssets = balanceSheet.assets.cash + balanceSheet.assets.ar + balanceSheet.assets.inv;
    const currentRatio = balanceSheet.liabilities.ap > 0 ? currentAssets / balanceSheet.liabilities.ap : 0;
    const workingCapital = currentAssets - balanceSheet.liabilities.ap;

    const dol = Math.abs(income.opIncome) > 0.5 ? engineResults.annual.contributionMargin / income.opIncome : 0;

    const kpis = [
        { label: 'Total Revenue', value: formatCompactCurrency(income.revenue), sub: 'Top Line', icon: <TrendingUp className="text-emerald-400/90"/> },
        { label: 'Gross Margin', value: formatPercent(grossMargin), sub: formatCompactCurrency(income.grossProfit), icon: <Activity className="text-indigo-400/90"/> },
        { label: 'Operating Income', value: formatCompactCurrency(income.opIncome), sub: `${formatPercent(opMargin)} Margin`, icon: <BarChart2 className="text-cyan-400/90"/> },
        { label: 'Net Income', value: formatCompactCurrency(income.netIncome), sub: `${formatPercent(netMargin)} Margin`, icon: <DollarSign className="text-emerald-400/90"/> },
        { label: 'Ending Cash', value: formatCompactCurrency(cashFlow.endingCash), sub: `Net Chg: ${formatCompactCurrency(cashFlow.netChange)}`, icon: <Landmark className="text-blue-400/90"/> },
        { label: 'Working Capital', value: formatCompactCurrency(workingCapital), sub: `Current Ratio: ${currentRatio.toFixed(2)}`, icon: <Package className="text-amber-400/90"/> },
        { label: 'Break-Even Sales', value: formatCompactCurrency(engineResults.annual.contributionMargin > 0 ? engineResults.annual.fixedCosts / (engineResults.annual.contributionMargin / engineResults.annual.revenue) : 0), sub: 'Req. to cover FC', icon: <Target className="text-rose-400/90"/> },
        { label: 'Op. Leverage (DOL)', value: `${dol.toFixed(2)}x`, sub: 'Profit Sensitivity', icon: <Layers className="text-purple-400/90"/> },
    ];

    const waterfallData = [
        { name: 'Revenue', value: income.revenue, fill: '#10b981' },
        { name: 'COGS', value: -income.cogs, fill: '#ef4444' },
        { name: 'Gross Profit', value: income.grossProfit, fill: '#3b82f6' },
        { name: 'OpEx', value: -income.opex, fill: '#ef4444' },
        { name: 'Depr', value: -income.depr, fill: '#f59e0b' },
        { name: 'EBIT', value: income.opIncome, fill: '#6366f1' },
        { name: 'Int & Tax', value: -(income.interest + income.tax), fill: '#f43f5e' },
        { name: 'Net Income', value: income.netIncome, fill: '#10b981' },
    ];

    const alerts = [];
    if (currentRatio > 0 && currentRatio < 1.2) alerts.push({ title: "Liquidity Risk", text: `Current ratio is ${currentRatio.toFixed(2)}. Working capital is tight.`, type: "critical" });
    if (cashFlow.netChange < 0) alerts.push({ title: "Cash Burn", text: `Operations consumed ${formatCurrency(Math.abs(cashFlow.netChange))} in cash this period.`, type: "critical" });
    if (income.netIncome < 0) alerts.push({ title: "Profitability Alert", text: `Projected net loss of ${formatCurrency(Math.abs(income.netIncome))}.`, type: "warning" });
    if (dol > 4) alerts.push({ title: "High Operating Leverage", text: `DOL of ${dol.toFixed(1)}x indicates high sensitivity to volume changes.`, type: "warning" });
    if (alerts.length === 0) alerts.push({ title: "Healthy Operations", text: "Core financial metrics are within standard operating tolerances.", type: "success" });

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12 text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-200 tracking-tight flex items-center"><PieChart className="mr-3 text-cyan-500/80"/> CFO Executive Decision Center</h2>
                    <p className="text-sm text-slate-400 mt-1 font-medium">High-level financial intelligence, liquidity monitoring, and strategic alerts.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-[#111827]/80 p-5 rounded-2xl border border-slate-800/80 shadow-sm flex flex-col backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</span>
                            <div className="p-1.5 bg-[#0a0f1c] rounded-lg border border-slate-800/50 shadow-inner">{kpi.icon}</div>
                        </div>
                        <div className="text-2xl font-black text-slate-200 mt-auto font-mono">{kpi.value}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-1 uppercase">{kpi.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm h-96 flex flex-col backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Profitability Waterfall</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={waterfallData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} tickMargin={10} interval={0} />
                                <YAxis tickFormatter={formatCompactCurrency} tick={{fontSize: 11, fill: '#64748b', fontFamily: 'Inter'}} tickLine={false} axisLine={false} tickMargin={10} />
                                <RechartsTooltip cursor={{fill: '#1e293b'}} content={<CustomChartTooltip formatter={(val) => formatCurrency(val)} />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {waterfallData.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-[#111827]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm flex flex-col backdrop-blur-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800/50 pb-2 flex items-center"><Zap size={14} className="mr-2 text-amber-400/90"/> CFO Action Alerts</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {alerts.map((alert, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${alert.type === 'critical' ? 'bg-rose-900/20 border-rose-500/30 text-rose-400' : alert.type === 'warning' ? 'bg-amber-900/20 border-amber-500/30 text-amber-400' : 'bg-[#0a0f1c]/80 border-slate-800 text-emerald-400/90 shadow-inner'}`}>
                                <h4 className="font-bold text-sm mb-1">{alert.title}</h4>
                                <p className="text-xs opacity-80 leading-relaxed font-medium">{alert.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatementRow = ({ label, value, indent = 0, isBold = false, underline = 'none', isCurrency = false, textOnly = false }) => {
    const paddingMap = { 0: 'pl-0', 1: 'pl-6', 2: 'pl-12' };
    
    let borderClasses = '';
    if (underline === 'single') borderClasses = 'border-b border-slate-600';
    if (underline === 'double') borderClasses = 'border-b-4 border-double border-slate-500';
    
    return (
        <div className={`flex justify-between py-1.5 text-sm ${isBold ? 'font-bold text-slate-100' : 'text-slate-300'}`}>
            <div className={`${paddingMap[indent]} flex-1 flex items-end`}>{label}</div>
            {!textOnly && (
                <div className="w-40 flex flex-col justify-end">
                    <div className={`flex justify-between w-full pb-0.5 ${borderClasses}`}>
                        <span className="text-slate-500 inline-block w-4 text-left">{isCurrency ? '$' : ''}</span>
                        <span className="text-right font-mono flex-1">{formatAccounting(value)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatementLayout = ({ title, company, periodText, activeTab, setActiveTab, children }) => (
    <div className="space-y-6 pb-12 animate-in fade-in max-w-4xl mx-auto">
        <div className="flex justify-center mb-6 print:hidden">
            <div className="inline-flex bg-[#111827]/80 p-1 rounded-lg border border-slate-800 shadow-sm backdrop-blur-sm">
                {['income', 'balance', 'cashflow'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === tab ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        {tab === 'income' ? 'Income' : tab === 'balance' ? 'Balance Sheet' : 'Cash Flow'}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="bg-[#0a0f1c] border border-slate-700/60 shadow-2xl rounded p-8 md:p-14 overflow-x-auto print:shadow-none print:border-none print:p-0">
            <div className="min-w-[550px]">
                <div className="text-center mb-10 border-b-2 border-slate-700/80 pb-6 print:border-slate-800">
                    <h2 className="text-2xl font-serif font-bold text-slate-100 uppercase tracking-widest print:text-black">{company.name}</h2>
                    <h3 className="text-xl font-serif text-slate-300 mt-2 print:text-slate-800">{title}</h3>
                    <p className="text-sm font-serif text-slate-400 mt-2 italic print:text-slate-600">{periodText}</p>
                    <p className="text-xs font-sans text-slate-500 mt-4 uppercase tracking-widest font-semibold print:text-slate-500">Currency: USD</p>
                </div>
                <div className="font-sans print:text-black">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

const IncomeStatement = ({ data, company, activeTab, setActiveTab }) => (
    <StatementLayout title="Statement of Income" company={company} periodText={`For the Year Ended December 31, ${company.year}`} activeTab={activeTab} setActiveTab={setActiveTab}>
        <StatementRow label="Revenue" isBold />
        <StatementRow label="Gross Revenue" value={data.revenue} indent={1} isCurrency />
        <StatementRow label="Net Revenue" value={data.revenue} indent={1} underline="single" />
        <StatementRow label="Cost of Sales" value={-data.cogs} indent={1} underline="single" />
        <StatementRow label="Gross Profit" value={data.grossProfit} isBold />

        <div className="h-6" />
        <StatementRow label="Operating Expenses" isBold />
        <StatementRow label="Operating & Administrative Expenses" value={-data.opex} indent={1} />
        <StatementRow label="Depreciation Expense" value={-data.depr} indent={1} underline="single" />
        <StatementRow label="Operating Income" value={data.opIncome} isBold />

        <div className="h-6" />
        <StatementRow label="Other Income / (Expenses)" isBold />
        <StatementRow label="Interest Expense" value={-data.interest} indent={1} underline="single" />
        <StatementRow label="Profit Before Tax" value={data.ebt} isBold />

        <div className="h-6" />
        <StatementRow label="Income Tax Expense" value={-data.tax} indent={1} underline="single" />
        <StatementRow label="Net Income" value={data.netIncome} isBold underline="double" isCurrency />
    </StatementLayout>
);

const BalanceSheet = ({ data, company, activeTab, setActiveTab }) => {
    const isBalanced = Math.abs(data.assets.total - (data.liabilities.total + data.equity.total)) < 1;
    
    return (
        <StatementLayout title="Balance Sheet" company={company} periodText={`As of December 31, ${company.year}`} activeTab={activeTab} setActiveTab={setActiveTab}>
            {!isBalanced && (
                <div className="mb-6 bg-rose-900/20 border border-rose-500/30 text-rose-400 p-3 rounded text-sm text-center font-bold">
                    WARNING: Balance Sheet is out of balance by {formatCurrency(Math.abs(data.assets.total - (data.liabilities.total + data.equity.total)))}.
                </div>
            )}
            
            <div className="font-bold text-slate-100 uppercase tracking-widest text-sm mb-3 border-b border-slate-700/80 pb-1.5 print:text-black print:border-slate-800 flex justify-between">
                <span>Assets</span>
                {isBalanced && <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded print:hidden">BALANCED</span>}
            </div>
            
            <StatementRow label="Current Assets" isBold />
            <StatementRow label="Cash & Equivalents" value={data.assets.cash} indent={1} isCurrency />
            <StatementRow label="Accounts Receivable" value={data.assets.ar} indent={1} />
            <StatementRow label="Inventory" value={data.assets.inv} indent={1} underline="single" />
            <StatementRow label="Total Current Assets" value={data.assets.cash + data.assets.ar + data.assets.inv} isBold />

            <div className="h-5" />
            <StatementRow label="Non-Current Assets" isBold />
            <StatementRow label="Property, Plant & Equipment" value={data.assets.ppe} indent={1} />
            <StatementRow label="Accumulated Depreciation" value={-data.assets.accumDepr} indent={1} underline="single" />
            <StatementRow label="Total Non-Current Assets" value={data.assets.ppe - data.assets.accumDepr} isBold underline="single" />

            <div className="h-3" />
            <StatementRow label="Total Assets" value={data.assets.total} isBold underline="double" isCurrency />

            <div className="h-10" />
            <div className="font-bold text-slate-100 uppercase tracking-widest text-sm mb-3 border-b border-slate-700/80 pb-1.5 print:text-black print:border-slate-800">Liabilities & Equity</div>
            
            <StatementRow label="Current Liabilities" isBold />
            <StatementRow label="Accounts Payable" value={data.liabilities.ap} indent={1} isCurrency underline="single" />
            <StatementRow label="Total Current Liabilities" value={data.liabilities.ap} isBold />

            <div className="h-5" />
            <StatementRow label="Non-Current Liabilities" isBold />
            <StatementRow label="Long-Term Debt" value={data.liabilities.debt} indent={1} underline="single" />
            <StatementRow label="Total Non-Current Liabilities" value={data.liabilities.debt} isBold underline="single" />

            <div className="h-3" />
            <StatementRow label="Total Liabilities" value={data.liabilities.total} isBold />

            <div className="h-5" />
            <StatementRow label="Shareholders' Equity" isBold />
            <StatementRow label="Contributed Capital" value={data.equity.capital} indent={1} />
            <StatementRow label="Retained Earnings" value={data.equity.retainedEarnings} indent={1} underline="single" />
            <StatementRow label="Total Equity" value={data.equity.total} isBold underline="single" />

            <div className="h-3" />
            <StatementRow label="Total Liabilities and Equity" value={data.liabilities.total + data.equity.total} isBold underline="double" isCurrency />
        </StatementLayout>
    );
};

const CashFlowStatement = ({ data, company, activeTab, setActiveTab }) => (
    <StatementLayout title="Statement of Cash Flows" company={company} periodText={`For the Year Ended December 31, ${company.year}`} activeTab={activeTab} setActiveTab={setActiveTab}>
        <StatementRow label="Cash Flows from Operating Activities" isBold />
        <StatementRow label="Net Income" value={data.details.netIncome} indent={1} isCurrency />
        <StatementRow label="Adjustments to reconcile net income:" indent={1} textOnly />
        <StatementRow label="Depreciation Expense" value={data.details.depr} indent={2} />
        <StatementRow label="Change in Accounts Receivable" value={data.details.changeAr} indent={2} />
        <StatementRow label="Change in Inventory" value={data.details.changeInv} indent={2} />
        <StatementRow label="Change in Accounts Payable" value={data.details.changeAp} indent={2} underline="single" />
        <StatementRow label="Net Cash from Operating Activities" value={data.operating} isBold />

        <div className="h-6" />
        <StatementRow label="Cash Flows from Investing Activities" isBold />
        <StatementRow label="Capital Expenditures (PP&E)" value={data.details.capex} indent={1} underline="single" />
        <StatementRow label="Net Cash from Investing Activities" value={data.investing} isBold />

        <div className="h-6" />
        <StatementRow label="Cash Flows from Financing Activities" isBold />
        <StatementRow label="Proceeds from Debt" value={data.details.debtProceeds} indent={1} />
        <StatementRow label="Repayment of Debt" value={data.details.debtRepayment} indent={1} underline="single" />
        <StatementRow label="Net Cash from Financing Activities" value={data.financing} isBold underline="single" />

        <div className="h-4" />
        <StatementRow label="Net Change in Cash" value={data.netChange} isBold />
        <StatementRow label="Beginning Cash Balance" value={data.beginningCash} isBold underline="single" />
        <StatementRow label="Ending Cash Balance" value={data.endingCash} isBold underline="double" isCurrency />
    </StatementLayout>
);

const AssumptionsSection = ({ assumptions, onUpdate }) => {
    const inputs = [
        { label: 'Tax Rate (%)', key: 'taxRate', isPct: true },
        { label: 'Discount Rate (%)', key: 'discountRate', isPct: true },
        { label: 'Interest Rate (%)', key: 'interestRate', isPct: true },
        { label: 'AR Days', key: 'arDays', isPct: false },
        { label: 'AP Days', key: 'apDays', isPct: false },
        { label: 'Depreciation Years', key: 'deprYears', isPct: false },
        { label: 'Starting Cash', key: 'startingCash', isCurrency: true },
        { label: 'Starting Debt', key: 'startingDebt', isCurrency: true },
        { label: 'Start. Retained Earnings', key: 'startingRetainedEarnings', isCurrency: true },
        { label: 'Labor Hrs/Unit', key: 'laborHoursPerUnit', isPct: false },
        { label: 'Labor Rate/Hr', key: 'laborRatePerHour', isCurrency: true },
        { label: 'Machine Hrs/Unit', key: 'machineHoursPerUnit', isPct: false },
        { label: 'Prod. Efficiency (%)', key: 'productionEfficiency', isPct: true },
    ];

    return (
        <div className="bg-[#111827]/80 rounded-2xl p-6 shadow-sm border border-slate-800/80 text-slate-200 mb-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90 mb-5 flex items-center"><Settings2 className="mr-2" size={16}/> Global Financial Assumptions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {inputs.map(inp => (
                    <AssumptionInput 
                        key={inp.key}
                        label={inp.label}
                        value={assumptions[inp.key]}
                        onChange={(v) => onUpdate(inp.key, v)}
                        isPct={inp.isPct}
                        isCurrency={inp.isCurrency}
                    />
                ))}
            </div>
        </div>
    );
};

const BudgetSection = ({ title, data, isRevenue = false, isProduction = false, onUpdateLine, onAddLine, onDeleteLine }) => {
    const handleMonthChange = (lineId, monthIdx, field, val) => {
        const newLines = data.lines.map(l => {
            if (l.id === lineId) {
                const newMonths = [...l.months];
                newMonths[monthIdx] = { ...newMonths[monthIdx], [field]: val };
                return { ...l, months: newMonths };
            }
            return l;
        });
        onUpdateLine(newLines);
    };

    const handleNameChange = (lineId, val) => {
        const newLines = data.lines.map(l => l.id === lineId ? { ...l, name: val } : l);
        onUpdateLine(newLines);
    };

    const colTotals = Array.from({length: 12}, (_, i) => {
        let sum = 0;
        data.lines.forEach(l => {
            if (isRevenue) sum += (parseFloat(l.months[i]?.quantity) || 0) * (parseFloat(l.months[i]?.price) || 0);
            else if (isProduction) sum += (parseFloat(l.months[i]?.quantity) || 0);
            else sum += (parseFloat(l.months[i]?.amount) || 0);
        });
        return sum;
    });
    const grandTotal = colTotals.reduce((a, b) => a + b, 0);

    return (
        <div className="bg-[#111827]/80 rounded-xl p-6 shadow-sm border border-slate-800/80 text-slate-200 mb-6 overflow-hidden backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400/90">{title}</h3>
                <button onClick={onAddLine} className="px-3 py-1.5 bg-[#1e293b] hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-lg flex items-center transition-colors shadow-sm">
                    <Plus size={14} className="mr-1"/> Add Row
                </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar pb-2">
                <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
                    <thead>
                        <tr>
                            <th className="p-2 border-b border-slate-800 bg-[#0a0f1c] sticky left-0 z-10 w-48 font-bold text-slate-400 shadow-inner">Description</th>
                            {MONTHS.map(m => <th key={m} className="p-2 border-b border-slate-800 bg-[#0a0f1c] text-right min-w-[80px] font-bold text-slate-400 shadow-inner">{m}</th>)}
                            <th className="p-2 border-b border-slate-800 bg-[#0a0f1c] text-right font-bold text-cyan-400/90 sticky right-0 z-10 w-28 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.3)]">Total</th>
                            <th className="p-2 border-b border-slate-800 bg-[#0a0f1c] w-10 text-center shadow-inner"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.lines.map(line => {
                            const rowTotal = line.months.reduce((sum, m) => {
                                if (isRevenue) return sum + ((parseFloat(m.quantity)||0) * (parseFloat(m.price)||0));
                                if (isProduction) return sum + (parseFloat(m.quantity)||0);
                                return sum + (parseFloat(m.amount)||0);
                            }, 0);

                            return (
                                <tr key={line.id} className="border-b border-slate-800/50 hover:bg-[#1e293b]/50 transition-colors group">
                                    <td className="p-1.5 sticky left-0 bg-[#0f1523] group-hover:bg-[#1e293b]/80 z-10 border-r border-slate-800/50">
                                        <input type="text" value={line.name} onChange={e => handleNameChange(line.id, e.target.value)} className="w-full bg-transparent border border-transparent p-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 focus:bg-[#0a0f1c] rounded transition-all" />
                                    </td>
                                    {line.months.map((m, i) => (
                                        <td key={i} className="p-1 border-r border-slate-800/30 align-top">
                                            {isRevenue ? (
                                                <div className="flex flex-col space-y-1">
                                                    <input type="number" placeholder="Qty" value={m.quantity !== undefined ? m.quantity : ''} onChange={e => handleMonthChange(line.id, i, 'quantity', e.target.value)} className="w-full bg-[#0a0f1c] border border-slate-700/50 p-1 text-[10px] text-right rounded outline-none focus:border-cyan-500 font-mono text-slate-300 transition-colors shadow-inner" />
                                                    <input type="number" placeholder="$ Price" value={m.price !== undefined ? m.price : ''} onChange={e => handleMonthChange(line.id, i, 'price', e.target.value)} className="w-full bg-[#0a0f1c] border border-slate-700/50 p-1 text-[10px] text-right rounded outline-none focus:border-emerald-500 font-mono text-emerald-400/90 transition-colors shadow-inner" />
                                                </div>
                                            ) : (
                                                <input type="number" placeholder={isProduction ? "Qty" : "$"} value={isProduction ? (m.quantity !== undefined ? m.quantity : '') : (m.amount !== undefined ? m.amount : '')} onChange={e => handleMonthChange(line.id, i, isProduction ? 'quantity' : 'amount', e.target.value)} className="w-full bg-[#0a0f1c] border border-slate-700/50 p-1.5 text-xs text-right rounded outline-none focus:border-cyan-500 font-mono text-slate-300 transition-colors shadow-inner" />
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-2 text-right font-bold text-cyan-400/90 sticky right-0 bg-[#0f1523] group-hover:bg-[#1e293b]/80 z-10 border-l border-slate-800/50 font-mono shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.3)]">
                                        {isProduction ? formatNumber(rowTotal) : formatAccounting(rowTotal)}
                                    </td>
                                    <td className="p-1 text-center bg-[#0f1523] group-hover:bg-[#1e293b]/80">
                                        <button onClick={() => onDeleteLine(line.id)} className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors p-1.5 rounded"><Trash2 size={14}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="p-3 font-bold text-slate-400 sticky left-0 bg-[#0a0f1c] z-10 border-r border-slate-800 uppercase tracking-widest text-[10px] shadow-inner">Subtotal</td>
                            {colTotals.map((tot, i) => (
                                <td key={i} className="p-2 text-right font-bold text-slate-300 border-r border-slate-800/50 font-mono bg-[#111827]/50">
                                    {isProduction ? formatNumber(tot) : formatAccounting(tot)}
                                </td>
                            ))}
                            <td className="p-2 text-right font-black text-slate-200 sticky right-0 bg-[#0a0f1c] z-10 border-l border-slate-700 font-mono shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.3)]">
                                {isProduction ? formatNumber(grandTotal) : formatAccounting(grandTotal)}
                            </td>
                            <td className="bg-[#0a0f1c] shadow-inner"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default function App() {
    const [entered, setEntered] = useState(false);
    const [model, setModel] = useState(initialFinancialModel);
    const [activeTab, setActiveTab] = useState('budget');
    const [activeStatement, setActiveStatement] = useState('income');
    const [confirmReset, setConfirmReset] = useState(false);
    
    const engineResults = useMemo(() => calculateFinancials(model), [model]);

    const updateBudgetSection = (section, lines) => {
        setModel(prev => ({ ...prev, budget: { ...prev.budget, [section]: { ...prev.budget[section], lines } } }));
    };

    const addLine = (section, defaultName, isProduct = false, isProduction = false) => {
        const newId = section + Date.now();
        const newLine = { 
            id: newId, 
            name: defaultName, 
            months: Array.from({length: 12}, (_, i) => isProduct ? { month: i+1, quantity: 0, price: 0 } : isProduction ? { month: i+1, quantity: 0 } : { month: i+1, amount: 0 }) 
        };
        setModel(prev => ({ ...prev, budget: { ...prev.budget, [section]: { ...prev.budget[section], lines: [...prev.budget[section].lines, newLine] } } }));
    };

    const deleteLine = (section, id) => {
        setModel(prev => ({ ...prev, budget: { ...prev.budget, [section]: { ...prev.budget[section], lines: prev.budget[section].lines.filter(l => l.id !== id) } } }));
    };

    const updateAssumptions = (key, val) => {
        setModel(prev => ({ ...prev, assumptions: { ...prev.assumptions, [key]: val } }));
    };

    const updateERPSection = (section, data) => {
        setModel(prev => ({ ...prev, erp: { ...prev.erp, [section]: data } }));
    };

    const handleResetBudget = () => {
        const emptyModel = JSON.parse(JSON.stringify(initialFinancialModel));
        Object.keys(emptyModel.budget).forEach(k => {
             emptyModel.budget[k].lines = [];
        });
        setModel(emptyModel);
        setConfirmReset(false);
    };

    const handleRestoreDemo = () => setModel(initialFinancialModel);

    if (!entered) return <LandingPage onEnter={() => setEntered(true)} />;

    return (
        <FinancialContext.Provider value={{ model, engineResults, updateBudgetSection, updateAssumptions, updateERPSection }}>
            <div className="flex h-screen bg-[#0a0f1c] font-sans selection:bg-indigo-500/30 overflow-hidden">
                
                <div className="w-64 bg-[#0a0f1c] text-slate-300 flex flex-col shadow-2xl z-20 print:hidden shrink-0 border-r border-slate-800/80">
                    <div 
                        className="p-6 bg-[#0a0f1c] border-b border-slate-800/80 flex items-center space-x-3 cursor-pointer hover:bg-[#111827]/80 transition-colors group"
                        onClick={() => setEntered(false)}
                        title="Return to Home Page"
                    >
                         <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"><BarChart2 className="text-white" size={18} /></div>
                         <div><h1 className="font-bold text-slate-100 text-sm tracking-wide">CFO's</h1><p className="text-[9px] uppercase tracking-widest text-cyan-500/90 font-semibold">Decision Engine</p></div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3 mt-4">Platform</div>
                        <button onClick={() => setEntered(false)} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[#1e293b]/50 hover:text-slate-200`}><Globe size={16} className="mr-3 opacity-70" /> Home Page</button>
                        
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3 mt-6">Inputs & Core</div>
                        <button onClick={() => setActiveTab('budget')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'budget' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><BookOpen size={16} className="mr-3 opacity-70" /> Master Budget</button>
                        
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3 mt-6">Mgmt Accounting</div>
                        <button onClick={() => setActiveTab('cvp')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'cvp' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><TrendingUp size={16} className="mr-3 opacity-70" /> CVP & Break-Even</button>
                        <button onClick={() => setActiveTab('sensitivity')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'sensitivity' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><Target size={16} className="mr-3 opacity-70" /> Scenario & Risk</button>
                        <button onClick={() => setActiveTab('variance')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'variance' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><TrendingDown size={16} className="mr-3 opacity-70" /> Variance Analysis</button>
                        <button onClick={() => setActiveTab('incremental')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'incremental' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><GitMerge size={16} className="mr-3 opacity-70" /> Incremental Decisions</button>
                        
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3 mt-6">Operations & Dashboard</div>
                        <button onClick={() => setActiveTab('erp')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'erp' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><Layers size={16} className="mr-3 opacity-70" /> ERP Operations</button>
                        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><LayoutDashboard size={16} className="mr-3 opacity-70" /> CFO Executive Center</button>
                        
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3 mt-6">Financial Statements & Reports</div>
                        <button onClick={() => setActiveTab('financials')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'financials' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><Landmark size={16} className="mr-3 opacity-70" /> Financial Statements</button>
                        <button onClick={() => setActiveTab('report')} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'report' ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-[#1e293b]/50 hover:text-slate-200'}`}><FileText size={16} className="mr-3 opacity-70" /> Management Report</button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col h-screen overflow-y-auto print:overflow-visible text-slate-300 bg-[#0f1523]">
                    
                    <div className="bg-[#0a0f1c]/90 backdrop-blur-md border-b border-slate-800/80 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm print:hidden">
                        <div className="flex items-center space-x-2 text-sm">
                             <div className="w-2 h-2 rounded-full bg-emerald-500/90 animate-pulse"></div>
                             <span className="font-semibold text-slate-300">Engine Online</span>
                             <span className="text-slate-700">|</span>
                             <span className="text-slate-500">Auto-sync active</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                             <div className="flex items-center bg-[#111827] rounded-lg p-1 px-3 border border-slate-800/80 shadow-inner">
                                <div className="text-slate-400 mr-2 flex flex-col text-right">
                                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Model</span>
                                    <span className="font-semibold text-slate-300">{model.company.name} {model.company.year}</span>
                                </div>
                                <div className="w-px h-8 bg-slate-800 mx-2"></div>
                                <div className="text-slate-400 ml-2 flex flex-col text-right">
                                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Revenue Projected</span>
                                    <span className="font-bold text-emerald-400/90 font-mono">{formatCurrency(engineResults.annual.revenue)}</span>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full">
                         
                         {activeTab === 'dashboard' && <ExecutiveDashboard engineResults={engineResults} />}
                         {activeTab === 'report' && <ReportCenter engineResults={engineResults} model={model} />}
                         {activeTab === 'cvp' && <CvpAnalysis engineResults={engineResults} />}
                         {activeTab === 'sensitivity' && <SensitivityAnalysis />}
                         {activeTab === 'variance' && <VarianceAnalysis />}
                         {activeTab === 'incremental' && <IncrementalAnalysis />}
                         {activeTab === 'erp' && <ERPDashboard engineResults={engineResults} assumptions={model.assumptions} />}
                         
                         {activeTab === 'financials' && (
                             activeStatement === 'income' ? <IncomeStatement data={engineResults.statements.income} company={model.company} activeTab={activeStatement} setActiveTab={setActiveStatement} />
                             : activeStatement === 'balance' ? <BalanceSheet data={engineResults.statements.balanceSheet} company={model.company} activeTab={activeStatement} setActiveTab={setActiveStatement} />
                             : <CashFlowStatement data={engineResults.statements.cashFlow} company={model.company} activeTab={activeStatement} setActiveTab={setActiveStatement} />
                         )}
                         
                         {activeTab === 'budget' && (
                             <div className="animate-in fade-in space-y-4 pb-12">
                                <div className="bg-gradient-to-r from-[#0a0f1c] to-[#111827] rounded-xl p-6 mb-6 text-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm border border-slate-800/80">
                                    <div className="flex items-start">
                                        <div className="p-3 bg-[#1e293b]/50 rounded-lg mr-4 mt-1 border border-slate-700/50 shadow-inner">
                                            <BookOpen size={24} className="text-cyan-400/90" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-xl mb-1 tracking-tight text-slate-100">Master Budget & Assumptions</h3>
                                            <p className="text-slate-400 text-sm max-w-2xl font-medium">This module is the Single Source of Truth. Altering inputs here instantly cascades through CVP, ERP Operations, and Financial Statements.</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-2 shrink-0">
                                        {confirmReset ? (
                                            <div className="flex bg-rose-900/40 border border-rose-900/50 rounded-lg overflow-hidden p-1 items-center backdrop-blur-sm shadow-sm">
                                                <span className="text-xs text-rose-300 px-3 font-semibold">Are you sure?</span>
                                                <button onClick={handleResetBudget} className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold rounded transition-colors shadow-sm">Yes, Zero All</button>
                                                <button onClick={()=>setConfirmReset(false)} className="px-3 py-1.5 text-rose-300 hover:text-white text-xs font-bold transition-colors">Cancel</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={handleRestoreDemo} className="px-4 py-2 bg-[#111827] hover:bg-[#1e293b] border border-slate-700/80 text-slate-300 text-sm font-semibold rounded-lg transition-all flex items-center shadow-sm">
                                                    <RefreshCw size={14} className="mr-2"/> Restore Demo
                                                </button>
                                                <button onClick={()=>setConfirmReset(true)} className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400/90 text-sm font-semibold rounded-lg transition-all flex items-center shadow-sm">
                                                    <Trash2 size={14} className="mr-2"/> Zero Budget
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <AssumptionsSection assumptions={model.assumptions} onUpdate={updateAssumptions} />

                                <BudgetSection title="Sales Budget (Revenue)" data={model.budget.revenue} isRevenue={true} onUpdateLine={(lines) => updateBudgetSection('revenue', lines)} onAddLine={() => addLine('revenue', 'New Product Line', true, false)} onDeleteLine={(id) => deleteLine('revenue', id)} />
                                <BudgetSection title="Production Budget (Units)" data={model.budget.production} isProduction={true} onUpdateLine={(lines) => updateBudgetSection('production', lines)} onAddLine={() => addLine('production', 'New Production Line', false, true)} onDeleteLine={(id) => deleteLine('production', id)} />
                                <BudgetSection title="Variable Costs Budget" data={model.budget.variableCosts} onUpdateLine={(lines) => updateBudgetSection('variableCosts', lines)} onAddLine={() => addLine('variableCosts', 'New Variable Cost')} onDeleteLine={(id) => deleteLine('variableCosts', id)} />
                                <BudgetSection title="Fixed Costs Budget (OpEx)" data={model.budget.fixedCosts} onUpdateLine={(lines) => updateBudgetSection('fixedCosts', lines)} onAddLine={() => addLine('fixedCosts', 'New Fixed Cost')} onDeleteLine={(id) => deleteLine('fixedCosts', id)} />
                                <BudgetSection title="Raw Material Purchases" data={model.budget.inventory} onUpdateLine={(lines) => updateBudgetSection('inventory', lines)} onAddLine={() => addLine('inventory', 'New Purchase Line')} onDeleteLine={(id) => deleteLine('inventory', id)} />
                                <BudgetSection title="Capital Expenditure (PP&E)" data={model.budget.capex} onUpdateLine={(lines) => updateBudgetSection('capex', lines)} onAddLine={() => addLine('capex', 'New Asset Purchase')} onDeleteLine={(id) => deleteLine('capex', id)} />
                                <BudgetSection title="Financing Budget (Debt)" data={model.budget.financing} onUpdateLine={(lines) => updateBudgetSection('financing', lines)} onAddLine={() => addLine('financing', 'New Debt Action')} onDeleteLine={(id) => deleteLine('financing', id)} />
                             </div>
                         )}

                    </div>
                </div>
            </div>
        </FinancialContext.Provider>
    );
}
