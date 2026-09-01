<?php

declare(strict_types=1);

if ($argc < 2) {
    fwrite(STDERR, "Usage: php parseXlsx.php <file.xlsx>\n");
    exit(1);
}

$path = $argv[1];
$zip = new ZipArchive();

if ($zip->open($path) !== true) {
    fwrite(STDERR, "Unable to open XLSX file\n");
    exit(1);
}

function readXml(ZipArchive $zip, string $name): ?SimpleXMLElement
{
    $content = $zip->getFromName($name);
    if ($content === false) {
        return null;
    }

    return simplexml_load_string($content);
}

function relTarget(ZipArchive $zip, string $relsPath, string $relId): ?string
{
    $rels = readXml($zip, $relsPath);
    if (!$rels) {
        return null;
    }

    foreach ($rels->Relationship as $relationship) {
        $attrs = $relationship->attributes();
        if ((string) $attrs['Id'] === $relId) {
            return (string) $attrs['Target'];
        }
    }

    return null;
}

$sharedStrings = [];
$sharedXml = readXml($zip, 'xl/sharedStrings.xml');
if ($sharedXml) {
    foreach ($sharedXml->si as $si) {
        $text = '';
        if (isset($si->t)) {
            $text = (string) $si->t;
        } else {
            foreach ($si->r as $run) {
                $text .= (string) $run->t;
            }
        }
        $sharedStrings[] = $text;
    }
}

function columnIndex(string $cellRef): int
{
    preg_match('/[A-Z]+/', strtoupper($cellRef), $matches);
    $letters = $matches[0] ?? 'A';
    $index = 0;
    for ($i = 0; $i < strlen($letters); $i++) {
        $index = ($index * 26) + (ord($letters[$i]) - 64);
    }
    return $index - 1;
}

$workbook = readXml($zip, 'xl/workbook.xml');
if (!$workbook) {
    fwrite(STDERR, "Invalid XLSX workbook\n");
    exit(1);
}

$workbook->registerXPathNamespace('main', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
$workbook->registerXPathNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');

$result = [];

foreach ($workbook->xpath('//main:sheet') as $sheet) {
    $attrs = $sheet->attributes();
    $relAttrs = $sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
    $sheetName = (string) $attrs['name'];
    $relId = (string) $relAttrs['id'];
    $target = relTarget($zip, 'xl/_rels/workbook.xml.rels', $relId);

    if (!$target) {
        continue;
    }

    $sheetPath = str_starts_with($target, 'worksheets/')
        ? 'xl/' . $target
        : 'xl/worksheets/' . basename($target);
    $sheetXml = readXml($zip, $sheetPath);

    if (!$sheetXml) {
        continue;
    }

    $rows = [];
    foreach ($sheetXml->sheetData->row as $row) {
        $values = [];
        foreach ($row->c as $cell) {
            $cellAttrs = $cell->attributes();
            $col = columnIndex((string) $cellAttrs['r']);
            $type = (string) ($cellAttrs['t'] ?? '');
            $value = '';

            if ($type === 's') {
                $value = $sharedStrings[(int) $cell->v] ?? '';
            } elseif ($type === 'inlineStr') {
                $value = (string) $cell->is->t;
            } else {
                $value = isset($cell->v) ? (string) $cell->v : '';
            }

            $values[$col] = $value;
        }

        if ($values) {
            ksort($values);
            $max = max(array_keys($values));
            $normalized = [];
            for ($i = 0; $i <= $max; $i++) {
                $normalized[] = $values[$i] ?? '';
            }
            $rows[] = $normalized;
        }
    }

    if (count($rows) < 2) {
        $result[$sheetName] = [];
        continue;
    }

    $headers = array_map(
        fn($header) => strtolower(trim((string) $header)),
        array_shift($rows)
    );

    $records = [];
    foreach ($rows as $row) {
        $record = [];
        $hasValue = false;
        foreach ($headers as $index => $header) {
            if ($header === '') {
                continue;
            }
            $value = $row[$index] ?? '';
            if ($value !== '') {
                $hasValue = true;
            }
            $record[$header] = $value;
        }
        if ($hasValue) {
            $records[] = $record;
        }
    }

    $result[$sheetName] = $records;
}

$zip->close();

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
