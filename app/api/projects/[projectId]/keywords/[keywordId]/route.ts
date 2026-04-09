import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: {
    projectId: string;
    keywordId: string;
  };
};

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.replace("Bearer ", "");

    if (!idToken) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;
    const { projectId, keywordId } = params;

    if (!projectId || !keywordId) {
      return NextResponse.json(
        { error: "Missing projectId or keywordId." },
        { status: 400 }
      );
    }

    const projectRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("projects")
      .doc(projectId);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const keywordRef = projectRef.collection("keywords").doc(keywordId);
    const keywordSnap = await keywordRef.get();
    if (!keywordSnap.exists) {
      return NextResponse.json({ error: "Keyword not found." }, { status: 404 });
    }

    const keywordData = keywordSnap.data();
    if (!keywordData || keywordData.userId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await keywordRef.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
