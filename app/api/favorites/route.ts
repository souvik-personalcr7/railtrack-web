import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/db';
import Favorite from '@/models/Favorite';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

function getAuthenticatedUserId(): string | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) return null;

    return decoded.userId;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}

export async function GET() {
  try {
    const userId = getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in to view favorites.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 }).lean();

    const mappedFavorites = favorites.map((fav: any) => ({
      id: String(fav.trainId || fav.trainNumber),
      number: String(fav.trainNumber || fav.trainId),
      name: fav.trainName,
      origin: fav.origin || { code: '', name: '' },
      destination: fav.destination || { code: '', name: '' },
      runsOn: Array.isArray(fav.runsOn) ? fav.runsOn : [],
      duration: fav.duration || '',
      departureTime: fav.departureTime || '',
      arrivalTime: fav.arrivalTime || '',
    }));

    return NextResponse.json({
      success: true,
      favorites: mappedFavorites,
    });
  } catch (error) {
    console.error('Fetch Favorites API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve favorites.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in to add favorites.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const train = body?.train;

    if (!train || (!train.id && !train.number)) {
      return NextResponse.json(
        { success: false, message: 'Valid train information is required.' },
        { status: 400 }
      );
    }

    const trainId = String(train.id || train.number);
    const trainNumber = String(train.number || train.id);
    const trainName = String(train.name || `Train #${trainNumber}`);
    const origin = train.origin || { code: '', name: '' };
    const destination = train.destination || { code: '', name: '' };
    const runsOn = Array.isArray(train.runsOn) ? train.runsOn : [];
    const duration = String(train.duration || '');
    const departureTime = String(train.departureTime || '');
    const arrivalTime = String(train.arrivalTime || '');

    await connectToDatabase();

    // Check if favorite already exists for this authenticated user
    let favorite = await Favorite.findOne({
      userId,
      $or: [{ trainId }, { trainNumber }],
    });

    if (favorite) {
      favorite.trainName = trainName;
      favorite.origin = origin;
      favorite.destination = destination;
      favorite.runsOn = runsOn;
      favorite.duration = duration;
      favorite.departureTime = departureTime;
      favorite.arrivalTime = arrivalTime;
      await favorite.save();
    } else {
      favorite = await Favorite.create({
        userId,
        trainId,
        trainNumber,
        trainName,
        origin,
        destination,
        runsOn,
        duration,
        departureTime,
        arrivalTime,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Train added to favorites successfully.',
      favorite: {
        id: String(favorite.trainId),
        number: String(favorite.trainNumber),
        name: favorite.trainName,
        origin: favorite.origin,
        destination: favorite.destination,
        runsOn: favorite.runsOn,
        duration: favorite.duration,
        departureTime: favorite.departureTime,
        arrivalTime: favorite.arrivalTime,
      },
    });
  } catch (error) {
    console.error('Add Favorite API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add train to favorites.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in to remove favorites.' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    let trainId = url.searchParams.get('trainId') || url.searchParams.get('id');

    if (!trainId) {
      try {
        const body = await req.json();
        trainId = body?.trainId || body?.id || body?.trainNumber || body?.number;
      } catch (e) {
        // Body was empty or not JSON
      }
    }

    if (!trainId) {
      return NextResponse.json(
        { success: false, message: 'Train ID or number is required to remove from favorites.' },
        { status: 400 }
      );
    }

    const trainKey = String(trainId);

    await connectToDatabase();

    // Delete ONLY the favorite belonging to the authenticated user
    const result = await Favorite.deleteMany({
      userId,
      $or: [{ trainId: trainKey }, { trainNumber: trainKey }],
    });

    return NextResponse.json({
      success: true,
      message: 'Train removed from favorites successfully.',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Delete Favorite API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove favorite.' },
      { status: 500 }
    );
  }
}
