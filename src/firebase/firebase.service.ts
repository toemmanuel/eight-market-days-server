import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

import serviceAccount from '../../marketdays-firebase-adminsdk.json';

@Injectable()
export class FirebaseService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      });
    }
  }

  async sendIncomingCallPush(token: string, payload: Record<string, string>) {
    await admin.messaging().send({
      token,

      data: payload,

      android: {
        priority: 'high',
        ttl: 1000 * 30,
      },

      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'background',
        },

        payload: {
          aps: {
            'content-available': 1,
          },
        },
      },
    });
  }
}
