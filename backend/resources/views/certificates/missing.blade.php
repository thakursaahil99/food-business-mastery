<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Certificate not found · Redbean Academy</title>
    <meta name="robots" content="noindex">
    <style>
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f1ede6; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #07070a; padding: 16px; }
        .card { max-width: 460px; background: #fff; border-radius: 18px; padding: 28px; text-align: center; box-shadow: 0 20px 50px -24px rgb(0 0 0 / .3); }
        h1 { margin: 12px 0 6px; font-size: 24px; }
        p { margin: 0; color: #6b6b76; font-size: 16px; line-height: 1.5; }
        code { background: #f6f3ee; padding: 2px 8px; border-radius: 6px; }
        img { width: 120px; }
    </style>
</head>
<body>
<div class="card">
    <img src="{{ asset('brand/redbean-logo.png') }}" alt="Red Bean Hospitality">
    <h1>No certificate found</h1>
    <p>We could not find a certificate with the code <code>{{ $code }}</code>. Please check the code, or contact Red Bean Hospitality.</p>
</div>
</body>
</html>
