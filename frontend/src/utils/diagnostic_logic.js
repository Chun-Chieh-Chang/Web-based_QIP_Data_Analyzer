/**
 * SPC Expert Diagnostic Engine
 * MECE Principle: Logic is separated from UI rendering.
 */

export const generateExpertDiagnostic = (data, type) => {
    if (!data) return [];
    let insights = [];

    if (type === 'batch') {
        const cpk = data.capability?.cpk || data.capability?.xbar_cpk || 0;
        const ppk = data.capability?.ppk || data.capability?.xbar_ppk || 0;
        const mean = Number(data.stats?.mean || data.stats?.xbar_mean || 0);
        const target = Number(data.specs?.target || 0);
        const usl = Number(data.specs?.usl || 0);
        const lsl = Number(data.specs?.lsl || 0);

        const violationsCount = (data.violations?.xbar_violations?.length || 0) +
            (data.violations?.r_violations?.length || 0) +
            (Array.isArray(data.violations) ? data.violations.length : 0);

        // 1. Capability Assessment
        if (cpk >= 1.67) insights.push(`✅ **精英級製程**: Cpk (${cpk.toFixed(3)}) 現狀極佳，公差帶寬裕。`);
        else if (cpk >= 1.33) insights.push(`🟢 **穩定製程**: Cpk (${cpk.toFixed(3)}) 符合國際品質要求。`);
        else if (cpk > 0) insights.push(`⚠️ **製程能力不足**: Cpk (${cpk.toFixed(3)}) 低於理想指標，建議檢討模具物理精度。`);

        // 2. Stability Analysis (Cpk vs Ppk)
        if (cpk > 0 && ppk > 0) {
            const stabilityRatio = ppk / cpk;
            if (stabilityRatio < 0.9) {
                insights.push(`🔍 **穩定性風險 (Stability Alert)**: Ppk 僅為 Cpk 的 ${(stabilityRatio * 100).toFixed(1)}%。這暗示「批次間」存在顯著波動，建議優先查驗原料批號與環境溫濕度紀錄。`);
            } else {
                insights.push(`✨ **製程高度穩定**: Cpk 與 Ppk 數據高度契合，顯示生產過程具有極低且可控的漂移量。`);
            }
        }

        // 3. Centering Analysis
        const tolerance = usl - lsl;
        if (target !== 0 && tolerance > 0) {
            const offset = ((mean - target) / tolerance) * 100;
            if (Math.abs(offset) > 10) {
                insights.push(`📍 **中心位置偏移**: 均值偏向${offset > 0 ? '上限 (USL)' : '下限 (LSL)'}達 ${Math.abs(offset).toFixed(1)}%。對於射出零件，這通常暗示**保壓壓力設定**或**模具溫度**需要針對性微調。`);
            }
        }

        // 4. Violation Handling
        if (violationsCount > 0) {
            insights.push(`🔴 **管制界限警報 (OOC)**: 統計偵測到 ${violationsCount} 個異常點。這些點位超出了統計管制界限，代表製程中存在「特殊原因」干擾，必須回溯生產履歷進行根本原因分析（RCA）。`);
        } else {
            insights.push(`🛡️ **統計受控狀態**: 目前所有數據點均落在管制界限內，製程處於統計受控狀態。`);
        }
    } else if (type === 'cavity') {
        const minCpk = data.cavities?.length > 0 ? Math.min(...data.cavities.map(c => c.cpk)) : 0;
        const maxCpk = data.cavities?.length > 0 ? Math.max(...data.cavities.map(c => c.cpk)) : 0;
        const cpkGap = maxCpk - minCpk;

        if (cpkGap > 0.4) {
            insights.push(`⚖️ **多穴不平衡警示**: 模穴間最大 Cpk 差異達 ${cpkGap.toFixed(2)}。強烈建議檢查**進膠系統 (Runner balance)**、**冷卻迴路一致性**或各穴口的**排氣狀況**。`);
        } else {
            insights.push(`✅ **模穴平衡性良好**: 各穴表現均勻，流道系統與冷卻效率一致。`);
        }

        if (minCpk < 1.33) {
            const weakCavities = data.cavities.filter(c => c.cpk < 1.33).map(c => c.cavity).join(', ');
            insights.push(`🛠️ **維修建議**: 模穴 [${weakCavities}] 的 Cpk 未達標，需優先針對這些穴號進行模仁尺寸檢驗或清潔維修。`);
        }
    }

    return insights;
};
