#!/bin/bash

echo "==================================="
echo "Transfer YES Tokens from Gnosis Safe"
echo "==================================="
echo ""
echo "Configuration:"
echo "- Safe Address: 0x27dBD952974cbFd2fEbD87890a82B50225e97bC9"
echo "- Token Contract: 0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"
echo "- YES Token ID: 65880048952541620153230365826580171049439578129923156747663728476967119230732"
echo "- Destination: 0x884F5C47fA1eCaF0C8957611f648Fb320551ab51"
echo "- Amount: 1000000 units"
echo ""
echo "This will transfer the YES tokens from your Gnosis Safe to your EOA wallet."
echo ""

# Check if .env exists
if [ ! -f "transfer/.env" ]; then
    echo "❌ ERROR: transfer/.env file not found!"
    echo ""
    echo "Please create transfer/.env with your private key:"
    echo "  cd transfer"
    echo "  echo 'PRIVATE_KEY=your_private_key_without_0x' > .env"
    echo ""
    exit 1
fi

echo "✅ Found .env file"
echo ""
echo "Ready to execute transfer..."
echo "Press ENTER to continue or Ctrl+C to cancel"
read

cd transfer
echo "Running transfer script..."
node simple-safe-transfer.js

echo ""
echo "After successful transfer, you can wrap the tokens by running:"
echo "  node scripts/execute-wrap-yes.js"