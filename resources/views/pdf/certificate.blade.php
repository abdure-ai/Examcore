<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificate of Completion</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background-color: #fcfbf7;
            margin: 0;
            padding: 0;
            color: #2d3748;
        }
        .cert-container {
            width: 100%;
            height: 100%;
            padding: 40px;
            box-sizing: border-box;
            position: relative;
        }
        .cert-border-outer {
            border: 8px double #b8860b;
            padding: 20px;
            height: 90%;
            box-sizing: border-box;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
        }
        .cert-border-inner {
            border: 2px solid #b8860b;
            height: 100%;
            padding: 40px;
            box-sizing: border-box;
            text-align: center;
            position: relative;
        }
        .cert-header {
            font-size: 46px;
            color: #1a202c;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-top: 20px;
            margin-bottom: 5px;
            font-weight: normal;
        }
        .cert-sub {
            font-size: 16px;
            font-style: italic;
            color: #718096;
            margin-bottom: 40px;
            letter-spacing: 1px;
        }
        .cert-name {
            font-size: 38px;
            color: #b8860b;
            font-weight: bold;
            margin-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
            display: inline-block;
            padding-bottom: 10px;
            min-width: 400px;
        }
        .cert-body {
            font-size: 18px;
            line-height: 1.6;
            max-width: 700px;
            margin: 0 auto 50px auto;
            color: #4a5568;
        }
        .cert-body strong {
            color: #1a202c;
        }
        .cert-footer {
            width: 100%;
            position: absolute;
            bottom: 40px;
            left: 0;
            padding: 0 80px;
            box-sizing: border-box;
        }
        .footer-col {
            width: 33%;
            float: left;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #a0aec0;
            width: 180px;
            margin: 40px auto 5px auto;
        }
        .footer-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .cert-number {
            font-family: monospace;
            font-size: 11px;
            color: #a0aec0;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="cert-container">
        <div class="cert-border-outer">
            <div class="cert-border-inner">
                <div class="cert-header">Certificate of Excellence</div>
                <div class="cert-sub">This is proudly presented to</div>
                
                <div class="cert-name">{{ $name }}</div>
                
                <div class="cert-body">
                    for successfully passing the online examination <strong>{{ $examTitle }}</strong> 
                    with a score of <strong>{{ $score }}%</strong>. This accomplishment demonstrates 
                    exceptional knowledge, skill, and commitment.
                </div>

                <div class="cert-footer">
                    <div class="footer-col">
                        <div class="signature-line"></div>
                        <div class="footer-label">Instructor Signature</div>
                    </div>
                    <div class="footer-col" style="padding-top: 15px;">
                        <img src="https://ui-avatars.com/api/?name=APPROVED&background=10b981&color=fff&size=80" style="border-radius: 50%; opacity: 0.8;" />
                        <div class="footer-label" style="margin-top: 5px;">Official Seal</div>
                    </div>
                    <div class="footer-col">
                        <div style="font-size: 16px; margin-top: 25px;">{{ $date }}</div>
                        <div class="signature-line" style="margin-top: 5px;"></div>
                        <div class="footer-label">Date Issued</div>
                    </div>
                    <div style="clear: both;"></div>
                    <div class="cert-number">Verification ID: {{ $certNumber }}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
