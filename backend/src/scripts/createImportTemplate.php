<?php

declare(strict_types=1);

function colName(int $index): string
{
    $name = '';
    while ($index > 0) {
        $index--;
        $name = chr(65 + ($index % 26)) . $name;
        $index = intdiv($index, 26);
    }
    return $name;
}

function xmlEsc(string $value): string
{
    return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
}

function sheetXml(array $rows): string
{
    $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        . 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        . '<sheetViews><sheetView workbookViewId="0" showGridLines="0">'
        . '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'
        . '</sheetView></sheetViews><cols>';

    for ($i = 1; $i <= 16; $i++) {
        $width = $i === 1 ? 12 : 18;
        $xml .= '<col min="' . $i . '" max="' . $i . '" width="' . $width . '" customWidth="1"/>';
    }

    $xml .= '</cols><sheetData>';

    foreach ($rows as $r => $row) {
        $rowNumber = $r + 1;
        $xml .= '<row r="' . $rowNumber . '">';
        foreach ($row as $c => $cell) {
            $cellRef = colName($c + 1) . $rowNumber;
            $style = $rowNumber === 1 ? ' s="1"' : '';
            if (is_int($cell) || is_float($cell)) {
                $xml .= '<c r="' . $cellRef . '"' . $style . '><v>' . $cell . '</v></c>';
            } else {
                $xml .= '<c r="' . $cellRef . '" t="inlineStr"' . $style . '><is><t>' . xmlEsc((string) $cell) . '</t></is></c>';
            }
        }
        $xml .= '</row>';
    }

    return $xml . '</sheetData></worksheet>';
}

function createXlsx(string $path, array $sheets): void
{
    $zip = new ZipArchive();
    if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new RuntimeException("Could not create {$path}");
    }

    $sheetCount = count($sheets);
    $sheetContentTypes = '';
    for ($i = 1; $i <= $sheetCount; $i++) {
        $sheetContentTypes .= '<Override PartName="/xl/worksheets/sheet' . $i . '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    }

    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        . '<Default Extension="xml" ContentType="application/xml"/>'
        . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        . '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        . '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
        . $sheetContentTypes . '</Types>');

    $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        . '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        . '</Relationships>');

    $workbookSheets = '';
    $workbookRels = '';
    $i = 1;
    foreach ($sheets as $name => $rows) {
        $workbookSheets .= '<sheet name="' . xmlEsc($name) . '" sheetId="' . $i . '" r:id="rId' . $i . '"/>';
        $workbookRels .= '<Relationship Id="rId' . $i . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' . $i . '.xml"/>';
        $zip->addFromString('xl/worksheets/sheet' . $i . '.xml', sheetXml($rows));
        $i++;
    }

    $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        . '<sheets>' . $workbookSheets . '</sheets></workbook>');

    $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        . $workbookRels
        . '<Relationship Id="rId' . $i . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        . '</Relationships>');

    $zip->addFromString('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        . '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>'
        . '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor indexed="64"/></patternFill></fill></fills>'
        . '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
        . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        . '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>'
        . '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');

    $zip->addFromString('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        . '<dc:title>Viyatnaam Petrol Pump Import Template</dc:title><dc:creator>Codex</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' . gmdate('c') . '</dcterms:created></cp:coreProperties>');
    $zip->addFromString('docProps/app.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Codex</Application></Properties>');

    $zip->close();
}

$sheets = [
    'README' => [
        ['field', 'value', 'note'],
        ['customer_name', 'Viyatnaam Petrol Pump', 'Admin import page par isi customer ko select karo'],
        ['important', 'id ya old_id ko old software id samjho', 'Importer new DB id mapping khud banayega'],
        ['dates', 'yyyy-mm-dd format use karo', 'Example: 2026-08-30'],
        ['relation_example', 'party.sid = head_master.id', 'Yahan old id bharna hai, new id backend banayega'],
        ['relation_example', 'tran.pid/crid = party.id', 'Cash, bank, customer, supplier sab party me rakho'],
        ['relation_example', 'trande.sid = tran.id', 'Sale/purchase/voucher header ka old id yahan use karo'],
    ],
    'head_master' => [
        ['id', 'name', 'head_type'],
        [1, 'Cash', 'Balance Sheet'],
        [2, 'Bank', 'Balance Sheet'],
        [3, 'Sales', 'Trading'],
        [4, 'Purchase', 'Trading'],
        [5, 'Expenses', 'Profit/Loss'],
        [6, 'Sundry Debtors', 'Balance Sheet'],
        [7, 'Sundry Creditors', 'Balance Sheet'],
    ],
    't_head_master' => [
        ['id', 'name'],
        [1, 'Sundry Debtors'],
        [2, 'Sundry Creditors'],
        [3, 'Direct Expense'],
        [4, 'Bank Account'],
    ],
    'product_category' => [
        ['id', 'name', 'unit'],
        [1, 'MS', 'LTR'],
        [2, 'HSD', 'LTR'],
        [3, 'Power Petrol', 'LTR'],
        [4, 'Engine Oil', 'PCS'],
        [5, 'CNG', 'KG'],
    ],
    'party' => [
        ['id', 'name', 'address', 'phone_no', 'openbal', 'sid', 'sid1', 'salary'],
        [1, 'Cash Account', 'Viyatnaam Petrol Pump', '9999999999', 0, 1, '', ''],
        [2, 'SBI Current Account', 'Main Branch', '0712000001', 250000, 2, 4, ''],
        [3, 'Ram Transport', 'Market Road', '8888888888', 15000, 6, 1, ''],
        [4, 'City Bus Service', 'Bus Stand Road', '7777777777', 32000, 6, 1, ''],
        [5, 'Bharat Petroleum Depot', 'Depot Area', '6666666666', -180000, 7, 2, ''],
        [6, 'Staff Salary Account', 'Office', '9555555555', 0, 5, 3, 25000],
        [7, 'Card Settlement Account', 'POS Machine', '9444444444', 12000, 2, 4, ''],
    ],
    'stock_item' => [
        ['id', 'name', 'inltr', 'pid', 'measure_unit', 'o_quantity', 'o_rate', 'gst', 'gst_code'],
        [1, 'MS Petrol', 1, 1, 'LTR', 12000, 101.25, 18, '2710'],
        [2, 'HSD Diesel', 1, 2, 'LTR', 18000, 92.10, 18, '2710'],
        [3, 'Power Petrol', 1, 3, 'LTR', 4500, 108.50, 18, '2710'],
        [4, 'Servo Engine Oil 1L', 0, 4, 'PCS', 120, 320, 18, '2710'],
        [5, 'CNG Gas', 0, 5, 'KG', 800, 84.75, 5, '2711'],
    ],
    'vehicle_master' => [
        ['id', 'name', 'balance', 'sid'],
        [1, 'MH12AB1234', 0, 3],
        [2, 'MH14CD5678', 5000, 3],
        [3, 'MH20EF9012', 0, 4],
        [4, 'MH22GH3456', 7500, 4],
    ],
    'nozel' => [
        ['id', 'name', 'snno', 'pid'],
        [1, 'Nozzle 1', 1, 1],
        [2, 'Nozzle 2', 2, 2],
        [3, 'Nozzle 3', 3, 1],
        [4, 'Nozzle 4', 4, 3],
        [5, 'CNG Nozzle 1', 5, 5],
    ],
    'tran' => [
        ['id', 'pid', 'crid', 'date', 'type', 'type1', 'remarks', 'amt', 'vehicle_no', 'slip_no'],
        [1, 3, 1, '2026-08-25', 'S', '', 'Diesel sale slip', 4605, 1, 'S-001'],
        [2, 4, 1, '2026-08-25', 'S', '', 'Petrol sale slip', 3037.50, 3, 'S-002'],
        [3, 5, 2, '2026-08-26', 'P', '', 'Fuel purchase invoice', 552600, '', 'P-001'],
        [4, 3, 1, '2026-08-27', 'C', 'Receipt', 'Cash received from Ram Transport', 10000, '', 'R-001'],
        [5, 5, 2, '2026-08-28', 'C', 'Payment', 'Payment to Bharat Petroleum Depot', 150000, '', 'P-002'],
        [6, 6, 1, '2026-08-29', 'O', 'Payment', 'Salary paid', 25000, '', 'V-001'],
        [7, 7, 2, '2026-08-30', 'C', 'Receipt', 'Card settlement received', 12000, '', 'R-002'],
    ],
    'trande' => [
        ['id', 'iid', 'sid', 'product_id', 'qty', 'rate', 'amt'],
        [1, 2, 1, 2, 50, 92.10, 4605],
        [2, 1, 2, 1, 30, 101.25, 3037.50],
        [3, 1, 3, 1, 3000, 101.25, 303750],
        [4, 2, 3, 2, 2500, 92.10, 230250],
        [5, 4, 3, 4, 10, 320, 3200],
    ],
    'bill' => [
        ['id', 'sdate', 'edate', 'date', 'billno', 'vehicleno', 'party', 'remarks', 'amt', 'type', 'tcs'],
        [1, '2026-08-25', '2026-08-25', '2026-08-25', 'B-001', 1, 3, 'Ram Transport daily bill', 4605, 'Sale', 0],
        [2, '2026-08-25', '2026-08-25', '2026-08-25', 'B-002', 3, 4, 'City Bus Service daily bill', 3037.50, 'Sale', 0],
        [3, '2026-08-01', '2026-08-30', '2026-08-30', 'B-003', 2, 3, 'Ram Transport monthly bill', 14605, 'Sale', 0],
    ],
    'customer_petrol' => [
        ['id', 'date', 'ship_no', 'pid', 'sid', 'qty', 'rate', 'amount'],
        [1, '2026-08-25', 'S-001', 3, 2, 50, 92.10, 4605],
        [2, '2026-08-25', 'S-002', 4, 1, 30, 101.25, 3037.50],
        [3, '2026-08-26', 'S-003', 3, 3, 20, 108.50, 2170],
        [4, '2026-08-27', 'S-004', 4, 5, 12, 84.75, 1017],
    ],
    'leak1' => [
        ['id', 'date', 'qty', 'iid'],
        [1, '2026-08-30', 2, 1],
        [2, '2026-08-30', 3, 2],
        [3, '2026-08-30', 1, 3],
    ],
    'meter' => [
        ['id', 'date', 'shift', 'msp', 'hsdp', 'ureap', 'cngp', 'speedp', 'msst', 'hsdst', 'ureast', 'cngst', 'speedst'],
        [1, '2026-08-25', 'Morning', 101.25, 92.10, 0, 84.75, 108.50, 12000, 18000, 0, 800, 4500],
        [2, '2026-08-25', 'Evening', 101.25, 92.10, 0, 84.75, 108.50, 11950, 17950, 0, 788, 4480],
        [3, '2026-08-26', 'Morning', 101.25, 92.10, 0, 84.75, 108.50, 11920, 17920, 0, 775, 4460],
    ],
    'meterde' => [
        ['id', 'opening', 'closing', 'sid', 'pid', 'iid', 'testing', 'sale'],
        [1, 1000, 1030, 1, 1, 1, 0, 30],
        [2, 2000, 2050, 1, 2, 2, 0, 50],
        [3, 1030, 1062, 2, 1, 3, 2, 30],
        [4, 500, 520, 2, 3, 4, 0, 20],
        [5, 300, 312, 2, 5, 5, 0, 12],
        [6, 1062, 1090, 3, 1, 1, 0, 28],
        [7, 2050, 2095, 3, 2, 2, 0, 45],
    ],
];

$outputDir = dirname(__DIR__, 2) . '/../outputs/import-templates';
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0777, true);
}

$path = $outputDir . '/viyatnaam_petrol_pump_import_template_enriched.xlsx';
createXlsx($path, $sheets);

echo realpath($path) . PHP_EOL;
