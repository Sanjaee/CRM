# Multi-stage build for ASP.NET Core Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["WahanaTravel.WebApi.csproj", "./"]
RUN dotnet restore "WahanaTravel.WebApi.csproj"

COPY . .
RUN dotnet publish "WahanaTravel.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*


ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

# Run as non-root user (UID 1000)
USER app

ENTRYPOINT ["dotnet", "WahanaTravel.WebApi.dll"]
