# Money Muling Detection Engine

A production-ready full-stack web application for detecting money muling patterns in financial transaction networks using graph-based algorithms.

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   React Frontend│         │  Express Backend│
│   (Vite + Tailwind)      │  (Node.js)      │
│                 │         │                 │
│  - Upload CSV   │────────▶│  - CSV Parser  │
│  - Graph View   │         │  - Graph Builder│
│  - Ring Table   │◀────────│  - Detection   │
│  - Summary      │         │  - Scoring     │
└─────────────────┘         └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │    MongoDB      │
                            │                 │
                            │  - Transactions │
                            │  - Suspicious   │
                            │  - Fraud Rings  │
                            └─────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Sigma.js** - Graph visualization library
- **Axios** - HTTP client
- **Graphology** - Graph data structure

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database (via Mongoose)
- **Graphology** - Graph processing library
- **csv-parser** - CSV file parsing
- **dayjs** - Date manipulation

## 📁 Project Structure

```
PW-RIFT/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload.jsx          # CSV upload component
│   │   │   ├── GraphView.jsx       # Sigma.js graph visualization
│   │   │   ├── RingTable.jsx       # Fraud rings table
│   │   │   └── SummaryPanel.jsx    # Analysis summary
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/
│   ├── models/
│   │   ├── Transaction.js         # Transaction schema
│   │   ├── SuspiciousAccount.js   # Suspicious account schema
│   │   └── FraudRing.js           # Fraud ring schema
│   ├── services/
│   │   ├── graphBuilder.js        # Graph construction
│   │   ├── detectionService.js    # Detection algorithms
│   │   ├── scoringService.js      # Scoring system
│   │   └── bonusFeatures.js       # Advanced features
│   ├── routes/
│   │   └── uploadRoute.js         # API routes
│   ├── server.js                  # Express server
│   └── package.json
└── README.md
```

## 🔍 Detection Algorithms

### 1. Circular Fund Routing (Cycles)
**Pattern**: Simple cycles of length 3 to 5 nodes

**Algorithm**: Depth-First Search (DFS) based cycle detection
- Start DFS from each node
- Track path and detect when path returns to start node
- Assign same `ring_id` to all accounts in cycle

**Complexity**: O(V * E) where V = vertices, E = edges

**Pattern Name**: `cycle_length_3`, `cycle_length_4`, `cycle_length_5`

### 2. Fan-In Pattern
**Pattern**: Receiver has ≥10 unique senders within 72-hour window

**Algorithm**:
1. Calculate in-degree for each node
2. Filter nodes with in-degree ≥ 10
3. Group transactions by 72-hour time windows
4. Count unique senders per window

**Complexity**: O(V + E) - linear scan with time window grouping

**Pattern Name**: `fan_in`

### 3. Fan-Out Pattern
**Pattern**: Sender sends to ≥10 unique receivers within 72-hour window

**Algorithm**:
1. Calculate out-degree for each node
2. Filter nodes with out-degree ≥ 10
3. Group transactions by 72-hour time windows
4. Count unique receivers per window

**Complexity**: O(V + E) - linear scan with time window grouping

**Pattern Name**: `fan_out`

### 4. Layered Shell Networks
**Pattern**: Paths of length ≥3 with intermediate nodes having ≤3 total transactions

**Algorithm**:
1. Find all paths of length 3-5 using DFS
2. Check intermediate nodes have low transaction count
3. Flag accounts in such paths

**Complexity**: O(V * E^d) where d = max path depth (5)

**Pattern Name**: `layered_shell`

## 📊 Scoring System

### Pattern Weights
- **Cycle (any length)**: 40 points
- **Fan-In**: 30 points
- **Fan-Out**: 30 points
- **Layered Shell**: 35 points
- **High Velocity Bonus**: +10 points

### Velocity Scoring
- Calculates transactions per hour
- Flags accounts with >50 transactions/hour
- Adds bonus score for high velocity

### False Positive Control
**Legitimate Merchant Detection**:
- Accounts with high in-degree AND high out-degree
- Transactions spread across ≥30 days
- Score reduced by 50% for legitimate merchants

### Final Score Calculation
```
base_score = sum(pattern_weights)
velocity_bonus = high_velocity ? 10 : 0
false_positive_adjustment = is_merchant ? 0.5 : 1.0

final_score = min(100, (base_score + velocity_bonus) * false_positive_adjustment)
```

## 🎁 Bonus Features

### 1. Betweenness Centrality
- Identifies critical bridge nodes in the network
- Nodes with high betweenness are key connectors
- Adds +5 to suspicion score if betweenness > 70

### 2. PageRank Anomaly Detection
- Calculates PageRank scores for all nodes
- Detects accounts with high PageRank but low degree
- Indicates unusual influence patterns
- Adds +8 to suspicion score for anomalies

### 3. Transaction Velocity Scoring
- Measures transaction frequency per account
- Identifies rapid-fire transaction patterns
- Already integrated in base scoring
- Adds +5 bonus for velocity > 80

## 📥 CSV Format

Required columns (exact match):
- `transaction_id` - Unique transaction identifier
- `sender_id` - Account ID of sender
- `receiver_id` - Account ID of receiver
- `amount` - Transaction amount (numeric)
- `timestamp` - Transaction timestamp (YYYY-MM-DD HH:MM:SS)

Example:
```csv
transaction_id,sender_id,receiver_id,amount,timestamp
TXN_001,ACC_001,ACC_002,1000.50,2024-01-15 10:30:00
TXN_002,ACC_002,ACC_003,500.25,2024-01-15 11:45:00
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI

# Start server
npm start
# or for development
npm run dev
```

### Frontend Setup

```bash
cd client
npm install

# Create .env file (optional)
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start dev server
npm run dev
```

### Environment Variables

**Backend (.env)**:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/money_muling_detection
NODE_ENV=development
```

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:5000/api
```

## 🌐 Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect your Git repository
3. Set build command: `cd server && npm install`
4. Set start command: `cd server && npm start`
5. Add environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `NODE_ENV` - `production`
   - `PORT` - Auto-set by Render

### Frontend (Vercel)

1. Import project to Vercel
2. Set root directory to `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` - Your Render backend URL

## 📈 Performance

### Complexity Analysis

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Graph Construction | O(E) | O(V + E) |
| Cycle Detection | O(V * E) | O(V) |
| Fan-In/Out Detection | O(V + E) | O(V) |
| Layered Shell | O(V * E^d) | O(V) |
| Scoring | O(V) | O(V) |
| **Total** | **O(V * E^d)** | **O(V + E)** |

Where:
- V = number of vertices (accounts)
- E = number of edges (transactions)
- d = max path depth (5)

### Performance Targets
- ✅ Handles up to 10,000 transactions
- ✅ Processing time < 30 seconds
- ✅ Uses adjacency list for efficient graph operations
- ✅ Avoids nested O(n²) loops where possible

### Optimizations
1. **Indexed MongoDB queries** - Fast transaction retrieval
2. **Adjacency list structure** - O(1) neighbor access
3. **Early termination** - Stop DFS at max depth
4. **Time window grouping** - Efficient fan-in/out detection
5. **Batch processing** - Process transactions in batches

## 📤 API Endpoints

### POST `/api/upload`
Upload CSV file and run analysis

**Request**: `multipart/form-data` with `file` field

**Response**:
```json
{
  "suspicious_accounts": [...],
  "fraud_rings": [...],
  "summary": {...}
}
```

### GET `/api/results`
Get latest analysis results

**Response**: Same as `/api/upload`

### GET `/api/graph`
Get graph data for visualization

**Response**:
```json
{
  "nodes": [...],
  "edges": [...]
}
```

### GET `/health`
Health check endpoint

## 🎨 Frontend Features

### Graph Visualization
- **Sigma.js** powered interactive graph
- **Color coding**: Red = suspicious, Blue = normal
- **Ring highlighting**: Same border color for ring members
- **Hover tooltips**: Account ID, degrees, suspicion score
- **Force-directed layout**: ForceAtlas2 algorithm

### Fraud Ring Table
- Ring ID, Pattern Type, Member Count
- Risk Score (color-coded)
- Member Account IDs (comma-separated)

### Summary Panel
- Total Accounts Analyzed
- Suspicious Accounts Flagged
- Fraud Rings Detected
- Processing Time
- Download JSON button

## 🧪 Testing

### Sample CSV Generation

```python
import csv
from datetime import datetime, timedelta
import random

# Generate sample transactions
transactions = []
base_time = datetime(2024, 1, 1, 10, 0, 0)

# Create cycle: ACC_001 -> ACC_002 -> ACC_003 -> ACC_001
for i in range(3):
    transactions.append({
        'transaction_id': f'TXN_{i+1:03d}',
        'sender_id': f'ACC_{i+1:03d}',
        'receiver_id': f'ACC_{(i+2)%3+1:03d}',
        'amount': random.uniform(100, 1000),
        'timestamp': (base_time + timedelta(hours=i)).strftime('%Y-%m-%d %H:%M:%S')
    })

# Write to CSV
with open('sample.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'])
    writer.writeheader()
    writer.writerows(transactions)
```

## 📝 License

ISC

## 👥 Contributors

Built for hackathon submission.

## 🎯 Performance Optimization

The detection system has been optimized to achieve:
- **Precision**: ≥70% (reduced false positives)
- **Recall**: ≥60% (improved fraud detection)

### Key Optimizations

1. **Enhanced Detection Algorithms**
   - Amount variance analysis for cycles
   - Amount diversity checks for fan-in/fan-out
   - Sliding window approach
   - Account lifecycle analysis

2. **Confidence-Based Scoring**
   - Pattern confidence weights
   - Multi-pattern correlation
   - Adaptive thresholds

3. **Improved False Positive Control**
   - Enhanced merchant detection
   - Multi-factor validation
   - Confidence-based filtering

4. **New Detection Patterns**
   - Amount anomaly detection
   - Rapid account creation detection
   - High activity density detection

See `OPTIMIZATION_REPORT.md` for detailed optimization analysis.

## 🔮 Future Enhancements

- Real-time transaction monitoring
- Machine learning-based pattern recognition
- Multi-currency support
- Advanced visualization filters
- Export to PDF reports
- Email alerts for high-risk accounts
