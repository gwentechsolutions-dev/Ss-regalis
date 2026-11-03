$ErrorActionPreference = 'Stop'
$email = Read-Host 'Admin email (Enter for ssregaladvisory@gmail.com)'
if ([string]::IsNullOrWhiteSpace($email)) { $email = 'ssregaladvisory@gmail.com' }
$secret = Read-Host 'Choose admin password (at least 12 characters)' -AsSecureString
$confirmation = Read-Host 'Confirm admin password' -AsSecureString
$first = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
$second = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmation)
try {
    $payload = @{ email = $email; password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($first); confirm = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($second) } | ConvertTo-Json -Compress
    $payload | node "$PSScriptRoot/admin-sql.cjs"
    if ($LASTEXITCODE -ne 0) { throw 'Admin SQL generation failed. Check the message above.' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($first)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($second)
    $payload = $null
    $secret.Dispose()
    $confirmation.Dispose()
}
