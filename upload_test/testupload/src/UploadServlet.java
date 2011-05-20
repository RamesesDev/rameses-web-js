
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.servlet.ServletFileUpload;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.List;
import java.util.Iterator;

import com.missiondata.fileupload.MonitoredDiskFileItemFactory;

public class UploadServlet extends HttpServlet
{
  protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
  {
    doPost(request,response);
  }

  protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
  {
    HttpSession session = request.getSession();

    if("status".equals(request.getParameter("c")))
    {
      doStatus(session, response);
    }
    else
    {
      doFileUpload(session, request, response);
    }
  }

  private void doFileUpload(HttpSession session, HttpServletRequest request, HttpServletResponse response) throws IOException
  {
    try
    {
      FileUploadListener listener = new FileUploadListener(request.getContentLength());
      session.setAttribute("FILE_UPLOAD_STATS", listener.getFileUploadStats());
      FileItemFactory factory = new MonitoredDiskFileItemFactory(listener);
      ServletFileUpload upload = new ServletFileUpload(factory);
      List items = upload.parseRequest(request);
      boolean hasError = false;
      for (Iterator i = items.iterator(); i.hasNext();)
      {
        FileItem fileItem = (FileItem) i.next();
        if (!fileItem.isFormField())
        {

          // *************************************************
          // This is where you would process the uploaded file
          // *************************************************

          fileItem.delete();
        }
      }

      if(!hasError)
      {
        sendCompleteResponse(response, null);
      }
      else
      {
        sendCompleteResponse(response, "Could not process uploaded file. Please see log for details.");
      }
    }
    catch (Exception e)
    {
      sendCompleteResponse(response, e.getMessage());
    }
  }

  private void doStatus(HttpSession session, HttpServletResponse response) throws IOException
  {
    // Make sure the status response is not cached by the browser
    response.addHeader("Expires", "0");
    response.addHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    response.addHeader("Cache-Control", "post-check=0, pre-check=0");
    response.addHeader("Pragma", "no-cache");

    FileUploadListener.FileUploadStats fileUploadStats = (FileUploadListener.FileUploadStats) session.getAttribute("FILE_UPLOAD_STATS");
    if(fileUploadStats != null)
    {
      long bytesProcessed = fileUploadStats.getBytesRead();
      long sizeTotal = fileUploadStats.getTotalSize();
      long percentComplete = (long)Math.floor(((double)bytesProcessed / (double)sizeTotal) * 100.0);
      long timeInSeconds = fileUploadStats.getElapsedTimeInSeconds();
      double uploadRate = bytesProcessed / (timeInSeconds + 0.00001);
      double estimatedRuntime = sizeTotal / (uploadRate + 0.00001);

      response.getWriter().println("<b>Upload Status:</b><br/>");

      if(fileUploadStats.getBytesRead() != fileUploadStats.getTotalSize())
      {
        response.getWriter().println("<div class=\"prog-border\"><div class=\"prog-bar\" style=\"width: " + percentComplete + "%;\"></div></div>");
        response.getWriter().println("Uploaded: " + bytesProcessed + " out of " + sizeTotal + " bytes (" + percentComplete + "%) " + (long)Math.round(uploadRate / 1024) + " Kbs <br/>");
        response.getWriter().println("Runtime: " + formatTime(timeInSeconds) + " out of " + formatTime(estimatedRuntime) + " " + formatTime(estimatedRuntime - timeInSeconds) + " remaining <br/>");
      }
      else
      {
        response.getWriter().println("Uploaded: " + bytesProcessed + " out of " + sizeTotal + " bytes<br/>");
        response.getWriter().println("Complete.<br/>");
      }
    }

    if(fileUploadStats != null && fileUploadStats.getBytesRead() == fileUploadStats.getTotalSize())
    {
      response.getWriter().println("<b>Upload complete.</b>");
    }
  }

  private void sendCompleteResponse(HttpServletResponse response, String message) throws IOException
  {
    if(message == null)
    {
      response.getOutputStream().print("<html><head><script type='text/javascript'>function killUpdate() { window.parent.killUpdate(''); }</script></head><body onload='killUpdate()'></body></html>");
    }
    else
    {
      response.getOutputStream().print("<html><head><script type='text/javascript'>function killUpdate() { window.parent.killUpdate('" + message + "'); }</script></head><body onload='killUpdate()'></body></html>");
    }
  }

  private String formatTime(double timeInSeconds)
  {
    long seconds = (long)Math.floor(timeInSeconds);
    long minutes = (long)Math.floor(timeInSeconds / 60.0);
    long hours = (long)Math.floor(minutes / 60.0);

    if(hours != 0)
    {
      return hours + "hours " + (minutes % 60) + "minutes " + (seconds % 60) + "seconds";
    }
    else if(minutes % 60 != 0)
    {
      return (minutes % 60) + "minutes " + (seconds % 60) + "seconds";
    }
    else
    {
      return (seconds % 60) + " seconds";
    }
  }
}
