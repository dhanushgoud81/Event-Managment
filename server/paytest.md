# Cashfree Payment Integration API Documentation (v2)

This document provides a highly detailed, code-level overview of the API endpoints and processes involved in the Cashfree payment integration for this application.

## 1. Overview

The integration is designed to allow users to purchase credits by making payments through Cashfree. The process involves three main steps:
1.  **Order Creation:** The user initiates a payment, and an order is created both in our local database and at Cashfree.
2.  **Payment Execution:** The user is redirected to the Cashfree checkout page to complete the payment.
3.  **Payment Verification:** The application verifies the payment status with Cashfree and updates the user's credit balance accordingly.

Additionally, webhooks are used to receive real-time notifications from Cashfree about payment events, which are logged for auditing and potential asynchronous processing.

## 2. Authentication

The critical payment-related API endpoints (`/api/create-order` and `/api/verify-payment`) are protected and require a user to be authenticated via NextAuth.js. The user's session information, particularly the user ID, is used to associate orders and credits with the correct user account.

## 3. Database Models

Three Mongoose models are central to the payment process:

### `User` (`src/models/User.ts`)
Stores user information, including their credit balance.
- `name`: `String`
- `email`: `String` (unique)
- `password`: `String` (hashed)
- `credits`: `Number` (defaults to 0)

### `Order` (`src/models/Order.ts`)
Stores details about each payment order.
- `userId`: `mongoose.Schema.Types.ObjectId` (ref: 'User')
- `amount`: `Number`
- `credits`: `Number`
- `cashfreeOrderId`: `String` (unique)
- `status`: `String` (Enum: 'PENDING', 'SUCCESS', 'FAILED', default: 'PENDING')
- `paymentSessionId`: `String`

### `WebhookEvent` (`src/models/WebhookEvent.ts`)
Logs all incoming webhook payloads from Cashfree for auditing and debugging.
- `data`: `Schema.Types.Mixed` (The full JSON payload from the webhook)
- `eventType`: `String`
- `receivedAt`: `Date` (default: `Date.now`)

The schema includes a text index (`{ '$**': 'text' }`) to allow for full-text search on the content of the webhook data.

## 4. API Endpoints

---

### `POST /api/create-order`

- **Purpose:** To create a payment order with Cashfree and record it in the local database.
- **Authentication:** Required (User session).

#### Function Signature & Source Code
```typescript
// File: src/app/api/create-order/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import User from '@/models/User';
import Order from '@/models/Order';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

interface CustomSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as CustomSession | null;

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { amount, credits, phone } = await req.json();

  if (!amount || !credits) {
    return NextResponse.json({ error: 'Missing amount or credits' }, { status: 400 });
  }
  
  // Use default phone number if not provided
  const phoneToUse = phone || '6300649828';

  try {
    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const order_id = `order_${uuidv4()}`;
    const return_url = `${process.env.NEXTAUTH_URL}/?order_id=${order_id}`;

    const response = await axios.post(
      'https://api.cashfree.com/pg/orders',
      {
        order_id: order_id,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: user.name || user._id.toString(),
          customer_email: user.email,
          customer_phone: phoneToUse,
        },
        order_meta: {
          return_url: return_url,
          notify_url: `${process.env.NEXTAUTH_URL}/api/webhook`, // Optional: for server-to-server updates
        },
      },
      {
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
        },
      }
    );

    const { payment_session_id } = response.data;

    const newOrder = new Order({
      userId: user._id,
      amount,
      credits,
      cashfreeOrderId: order_id,
      paymentSessionId: payment_session_id,
    });

    await newOrder.save();

    return NextResponse.json({ payment_session_id });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Create Order Error:', error.response?.data || error.message);
    } else {
      console.error('Create Order Error:', error);
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
```

#### Parameters & Request Body
- **Body**: `application/json`
  - `amount` (Number, **required**): The monetary amount to be charged in INR.
  - `credits` (Number, **required**): The number of credits the user is purchasing.
  - `phone` (String, *optional*): The user's phone number. If not provided, a hardcoded default (`6300649828`) is used.

#### Detailed Workflow
1.  **Authentication Check**: The function begins by calling `getServerSession(authOptions)` to check for a valid user session. If no session exists, it returns a `401 Unauthorized` error.
2.  **Body Parsing**: It parses the JSON body of the request to extract `amount`, `credits`, and `phone`. It returns a `400 Bad Request` if `amount` or `credits` are missing.
3.  **Database Connection**: It ensures a connection to MongoDB is established.
4.  **User Lookup**: It finds the currently logged-in user in the `users` collection using `User.findById(session.user.id)`.
5.  **Order ID Generation**: A unique order ID is generated using `uuidv4()` and prefixed with `order_`. This ID will be used to track the order on both our side and Cashfree's.
6.  **Cashfree API Call**:
    - It makes an `axios.post` request to Cashfree's order creation endpoint (`https://api.cashfree.com/pg/orders`).
    - The request payload includes our generated `order_id`, the `order_amount`, customer details (pulled from the user object), and metadata.
    - `order_meta.return_url`: This is a crucial parameter that tells Cashfree where to redirect the user after the payment attempt. The `order_id` is appended as a query parameter to this URL for later verification.
    - `order_meta.notify_url`: This specifies the endpoint (`/api/webhook`) that Cashfree will use to send server-to-server notifications.
    - The request headers include the `CASHFREE_CLIENT_ID` and `CASHFREE_CLIENT_SECRET` for authentication with the Cashfree API.
7.  **Database Operation**:
    - Upon a successful response from Cashfree, the `payment_session_id` is extracted from the response data.
    - A new `Order` document is created in the `orders` collection.
    - This document stores a complete record of the transaction initiation, linking the `userId`, `amount`, `credits`, `cashfreeOrderId`, and the `paymentSessionId`. The initial `status` is `'PENDING'`.
8.  **Response**: The `payment_session_id` is returned to the client in a JSON response. The client-side code will use this ID to launch the Cashfree checkout SDK.

---

### `POST /api/verify-payment`

- **Purpose:** To verify the final status of a payment after the user completes the checkout process.
- **Authentication:** Required (User session).

#### Function Signature & Source Code
```typescript
// File: src/app/api/verify-payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import axios from 'axios';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { order_id } = await req.json();
  if (!order_id) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const response = await axios.get(
      `https://api.cashfree.com/pg/orders/${order_id}/payments`,
      {
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
        },
      }
    );

    const cashfreePayments = response.data;

    const localOrder = await Order.findOne({ cashfreeOrderId: order_id });

    if (!localOrder) {
      return NextResponse.json({ error: 'Order not found in our system' }, { status: 404 });
    }

    if (localOrder.status === 'SUCCESS') {
        const user = await User.findById(localOrder.userId);
        return NextResponse.json({ success: true, message: 'Payment already verified.', credits: user?.credits });
    }

    if (cashfreePayments && cashfreePayments.length > 0 && cashfreePayments[0].payment_status === 'SUCCESS') {
      localOrder.status = 'SUCCESS';
      await localOrder.save();

      const updatedUser = await User.findByIdAndUpdate(
        localOrder.userId,
        { $inc: { credits: localOrder.credits } },
        { new: true }
      );

      return NextResponse.json({ success: true, message: 'Payment successful!', credits: updatedUser?.credits });
    } else {
      localOrder.status = 'FAILED';
      await localOrder.save();
      const paymentStatus = cashfreePayments && cashfreePayments.length > 0 ? cashfreePayments[0].payment_status : 'NOT_PAID';
      return NextResponse.json({ success: false, message: `Payment not successful. Status: ${paymentStatus}` }, { status: 400 });
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error verifying payment:', error.response?.data || error.message);
    } else {
      console.error('Error verifying payment:', error);
    }
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
```

#### Parameters & Request Body
- **Body**: `application/json`
  - `order_id` (String, **required**): The `cashfreeOrderId` (e.g., `order_...`) received in the `return_url` query parameter.

#### Detailed Workflow
1.  **Authentication & Validation**: Checks for a valid user session and ensures an `order_id` is present in the request body.
2.  **Cashfree API Call**: It makes an `axios.get` request to Cashfree's payment status endpoint (`https://api.cashfree.com/pg/orders/${order_id}/payments`) to fetch the latest payment information for the order.
3.  **Database Lookup**: It finds the corresponding order in the local `orders` collection using the `cashfreeOrderId`.
4.  **Idempotency Check**: It checks if `localOrder.status` is already `'SUCCESS'`. If it is, the function immediately returns a success message without reprocessing. This prevents a user from getting credits twice if they refresh the page.
5.  **Success Logic**:
    - It checks if the `payment_status` from the Cashfree API response is `'SUCCESS'`.
    - **Database Operation 1**: The `status` of the `localOrder` document is updated to `'SUCCESS'` and saved.
    - **Database Operation 2**: The `User` document is updated using `findByIdAndUpdate` with an atomic `$inc` operation to add the purchased credits (`localOrder.credits`) to the user's existing credit balance. Using `$inc` is crucial for preventing race conditions.
    - A success response with the user's new credit total is returned.
6.  **Failure Logic**: If the payment was not successful, the `localOrder.status` is updated to `'FAILED'`, and a failure message is returned to the client.

---

### `POST /api/webhook`

- **Purpose:** To receive and immutably log server-to-server notifications from Cashfree.
- **Authentication:** None. This is a public endpoint.

#### Function Signature & Source Code
```typescript
// File: src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import WebhookEvent from '@/models/WebhookEvent';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Received webhook payload:', payload);

    await connectToDatabase();

    const newWebhookEvent = new WebhookEvent({
      data: payload.data || payload,
      eventType: payload.type || 'unknown',
      receivedAt: new Date(),
    });

    await newWebhookEvent.save();
    console.log('Webhook event saved successfully');

    return NextResponse.json({ status: 'success', received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: message,
        received: true 
      }, 
      { status: 200 }
    );
  }
}
```

#### Parameters & Request Body
- **Body**: `application/json`. The structure is dynamic and determined by Cashfree based on the event type.

#### Detailed Workflow & Database Handling
1.  **Payload Reception**: The function receives a `POST` request and parses its JSON body into a `payload` object.
2.  **Database Connection**: It connects to the MongoDB database.
3.  **Database Operation**:
    - A new `WebhookEvent` document is instantiated.
    - `data`: The entire `payload` object (or `payload.data` if it exists) is stored in this field. This ensures no information is lost.
    - `eventType`: The `type` field from the payload is stored. If it's missing, it defaults to `'unknown'`.
    - `receivedAt`: The current date and time are stored.
    - The new document is saved to the `webhook_events` collection.
4.  **Response**:
    - The function returns a JSON response with `status: 'success'` and a `200 OK` status code, even if there was an error saving to the database.
    - **Crucial Design Choice**: Responding with `200 OK` is essential because Cashfree expects an acknowledgment. If it receives an error status (e.g., 500), it will retry sending the webhook, which could lead to duplicate processing. By always acknowledging receipt, we ensure the webhook is not resent, and we handle any processing errors internally by logging them. The primary goal of this endpoint is to **log the event**, not to perform critical business logic.

---

### `GET & DELETE /api/orders`

- **Purpose:** To provide an interface for viewing and managing the logged webhook events.
- **Authentication:** None.

#### Function Signatures & Source Code
```typescript
// File: src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import WebhookEvent from '@/models/WebhookEvent';
import { ObjectId } from 'mongodb';

interface Query {
  $text?: { $search: string };
  receivedAt?: { $gte?: Date; $lte?: Date };
}

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const searchQuery = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'receivedAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const query: Query = {};

        if (searchQuery) {
            query.$text = { $search: searchQuery };
        }

        if (startDate || endDate) {
            query.receivedAt = {};
            if (startDate) {
                query.receivedAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.receivedAt.$lte = new Date(endDate);
            }
        }

        const events = await WebhookEvent.find(query)
            .sort({ [sortBy]: sortOrder })
            .lean();

        return NextResponse.json(events);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Failed to fetch webhook events:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const result = await WebhookEvent.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Failed to delete event:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: message },
            { status: 500 }
        );
    }
}
```

#### `GET` Request
- **Parameters (Query)**:
  - `search` (String): Performs a full-text search using the text index on the `WebhookEvent` model.
  - `sortBy` (String): Field to sort by (default: `receivedAt`).
  - `sortOrder` (String): `asc` or `desc` (default: `desc`).
  - `startDate` / `endDate` (String): ISO date strings for date range filtering.
- **Database Operation**: Builds and executes a `find()` query on the `webhook_events` collection with dynamic filtering and sorting.

#### `DELETE` Request
- **Parameters (Query)**:
  - `id` (String, **required**): The MongoDB `_id` of the event to delete.
- **Database Operation**: Executes a `deleteOne()` query on the `webhook_events` collection to remove the specified event.

## 5. End-to-End User & Data Flow

This section illustrates the complete user journey from purchasing credits to seeing the updated balance, detailing the interactions between the user, the frontend, the backend API, and the Cashfree service.

### Visual Flow Diagram

Here is a simplified visual representation of the entire process:

```
+-------+      +-----------------+      +-----------------+      +------------------+
|       |      |  Frontend       |      |  Backend API    |      |  Cashfree        |
| User  |      | (Next.js/React) |      | (/api/*)        |      | (Payment Gateway)|
+-------+      +-----------------+      +-----------------+      +------------------+
    |                  |                      |                      |
    | 1. Clicks        |                      |                      |
    |   "Buy Now"      |                      |                      |
    |----------------->|                      |                      |
    |                  | 2. POST /api/create-order |                      |
    |                  |   (amount, credits)  |                      |
    |                  |--------------------->|                      |
    |                  |                      | 3. POST /pg/orders   |
    |                  |                      |--------------------->|
    |                  |                      |                      | 4. Returns
    |                  |                      | <--------------------| payment_session_id
    |                  |                      |                      |
    |                  | 5. Returns           |                      |
    |                  |    payment_session_id|                      |
    |                  | <--------------------|                      |
    |                  |                      |                      |
    |                  | 6. Initializes       |                      |
    |                  |    Cashfree SDK      |                      |
    | <----------------|                      |                      |
    |                  |                      |                      |
    | 7. Completes     |                      |                      |
    |    Payment       |=============================================>|
    |                  |                      |                      |
    | 8. Redirects user back to `return_url` |                      |
    | <==============================================================|
    | (with order_id in query)               |                      |
    |                  |                      |                      |
    |                  | 9. POST /api/verify-payment |                      |
    |                  |   (order_id)         |                      |
    |                  |--------------------->|                      |
    |                  |                      | 10. GET /pg/orders/{id}/payments
    |                  |                      |--------------------->|
    |                  |                      |                      | 11. Returns
    |                  |                      | <--------------------| payment_status
    |                  |                      |                      |
    |                  | 12. Updates DB       |                      |
    |                  |   (Order & User credits)|                    |
    |                  |                      |                      |
    |                  | 13. Returns success  |                      |
    |                  |     & new credits    |                      |
    |                  | <--------------------|                      |
    |                  |                      |                      |
    | 14. UI updates   |                      |                      |
    | with new credits |                      |                      |
    | <----------------|                      |                      |
    |                  |                      |                      |
    |                  |                      | 15. (Async) POST     |
    |                  |                      |     /api/webhook     |
    |                  |                      | <--------------------|
    |                  |                      |                      |
    |                  |                      | 16. Logs webhook     |
    |                  |                      |      event to DB     |
    |                  |                      |--------------------->| (WebhookEvent)
    |                  |                      |                      |
```

### Step-by-Step Breakdown

1.  **Initiation (User & Frontend)**:
    - The user is on the homepage (`src/app/page.tsx`).
    - They click the "Buy Now" button for a specific product (e.g., 100 credits for ₹10).
    - This action triggers the `handlePayment` function in the frontend component.

2.  **Order Creation (Frontend → Backend)**:
    - The `handlePayment` function makes a `POST` request to `/api/create-order`.
    - The request body contains `{ amount: 10, credits: 100, phone: '...' }`.

3.  **Cashfree Order (Backend → Cashfree)**:
    - The `/api/create-order` endpoint receives the request.
    - It generates a unique `cashfreeOrderId` (e.g., `order_12345`).
    - It then makes a `POST` request to Cashfree's `/pg/orders` API with all the necessary details.

4.  **Session ID (Cashfree → Backend → Frontend)**:
    - Cashfree processes the order and returns a `payment_session_id`.
    - The backend API saves a preliminary order record to the `orders` collection in MongoDB with `status: 'PENDING'` and the `payment_session_id`.
    - The backend then forwards this `payment_session_id` to the frontend in its response.

5.  **Checkout (Frontend & Cashfree)**:
    - The frontend, upon receiving the `payment_session_id`, initializes the `Cashfree.js` SDK.
    - The SDK uses the session ID to redirect the user to the Cashfree payment page.

6.  **Payment Completion (User & Cashfree)**:
    - The user enters their payment details (card, UPI, etc.) on the Cashfree page and completes the transaction.

7.  **Redirection (Cashfree → Frontend)**:
    - After the payment attempt, Cashfree redirects the user back to the `return_url` that was specified in step 3.
    - This URL now contains the order ID as a query parameter: `/?order_id=order_12345`.

8.  **Verification (Frontend → Backend)**:
    - The frontend component (`PaymentHandler` in `page.tsx`) detects the `order_id` in the URL using `useSearchParams`.
    - It immediately makes a `POST` request to `/api/verify-payment` with the `order_id`.

9.  **Status Check (Backend → Cashfree)**:
    - The `/api/verify-payment` endpoint calls Cashfree's `/pg/orders/{id}/payments` API to get the definitive `payment_status`.

10. **Database Update (Backend)**:
    - If the status from Cashfree is `'SUCCESS'`, the backend performs two crucial database updates:
        1.  It updates the corresponding document in the `orders` collection, setting `status: 'SUCCESS'`.
        2.  It atomically increments the `credits` field for the user in the `users` collection.
    - The backend then returns a success message and the user's new total credit balance to the frontend.

11. **UI Update (Frontend)**:
    - The frontend receives the successful response and updates the UI to display the new credit balance to the user. The payment flow is now complete from the user's perspective.

12. **Asynchronous Webhook (Cashfree → Backend)**:
    - Independently of the user's redirection, Cashfree sends a `POST` request to the `/api/webhook` endpoint (the `notify_url` from step 3).
    - This webhook contains the full details of the transaction.
    - The `/api/webhook` endpoint's only job is to save this entire payload as a new document in the `webhook_events` collection for logging and auditing purposes. It immediately returns a `200 OK` to Cashfree.
